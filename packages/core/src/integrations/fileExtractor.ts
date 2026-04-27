import { promisify } from 'node:util'
import { execFile as execFileCb } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { HttpError } from '../errors/httpError.js'
import {
  extractorScriptPath,
  formatFileProcessingUnavailableMessage,
  getFileProcessingCapability,
  pythonExecutable,
} from './fileProcessing.js'

const execFile = promisify(execFileCb)

export interface ExtractFileContentArgs {
  auth: boolean
  source: string
  integration?: string
  previewPages?: number
}

export interface ExtractedFileContent {
  kind: string
  content: string
  warnings?: string[]
  metadata?: Record<string, unknown>
  pageImages?: string[]
}

function isAbsoluteHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  }
  catch {
    return false
  }
}

function isDataUrl(value: string): boolean {
  return String(value || '').trimStart().toLowerCase().startsWith('data:')
}

function parseContentDispositionFilename(value: string | null): string | undefined {
  if (!value)
    return undefined

  const utf8Match = value.match(/filename\*\s*=\s*UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1])
    }
    catch {}
  }

  const plainMatch = value.match(/filename\s*=\s*"([^"]+)"/i) || value.match(/filename\s*=\s*([^;]+)/i)
  const raw = plainMatch?.[1]?.trim()
  if (!raw)
    return undefined
  return raw.replace(/^"(.*)"$/, '$1')
}

function sanitizeFilename(value: string | undefined): string {
  const base = String(value || '').trim()
  const candidate = base ? basename(base) : 'downloaded-file'
  const cleaned = candidate.replace(/[^\w.\-]+/g, '_').replace(/^_+|_+$/g, '')
  return cleaned || 'downloaded-file'
}

function extensionFromContentType(value: string | null): string {
  const normalized = String(value || '').split(';', 1)[0]!.trim().toLowerCase()
  switch (normalized) {
    case 'application/pdf':
      return '.pdf'
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return '.docx'
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      return '.xlsx'
    case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      return '.pptx'
    case 'text/plain':
      return '.txt'
    case 'text/markdown':
      return '.md'
    case 'text/csv':
      return '.csv'
    case 'application/json':
      return '.json'
    case 'text/html':
      return '.html'
    default:
      return ''
  }
}

function inferFilename(response: Response, source: string): string {
  const fromHeader = parseContentDispositionFilename(response.headers.get('content-disposition'))
  if (fromHeader)
    return sanitizeFilename(fromHeader)

  if (isAbsoluteHttpUrl(source)) {
    try {
      const url = new URL(source)
      const leaf = basename(url.pathname)
      if (leaf && leaf !== '/')
        return sanitizeFilename(leaf)
    }
    catch {}
  }

  const fromPath = basename(String(source || '').split('?', 1)[0] || '')
  const sanitized = sanitizeFilename(fromPath)
  if (sanitized !== 'downloaded-file')
    return sanitized

  const ext = extensionFromContentType(response.headers.get('content-type'))
  return `downloaded-file${ext}`
}

function parseDataUrl(source: string): { bytes: Buffer, filename: string } {
  const match = String(source || '').match(/^data:([^,]*),(.*)$/s)
  if (!match)
    throw new HttpError(400, 'Invalid data URL passed to extractFileContent.')

  const metadata = match[1] || ''
  const rawPayload = match[2] || ''
  const metadataParts = metadata.split(';').map(part => part.trim()).filter(Boolean)
  const mimeType = metadataParts.find(part => part.toLowerCase() !== 'base64' && !part.includes('=')) || 'application/octet-stream'
  const isBase64 = metadataParts.some(part => part.toLowerCase() === 'base64')
  if (!isBase64)
    throw new HttpError(400, 'extractFileContent data URLs must use base64 encoding.')

  let payload = rawPayload.replace(/\s/g, '')
  try {
    payload = decodeURIComponent(payload)
  }
  catch {}

  if (!payload || payload.length % 4 === 1 || !/^[A-Za-z0-9+/]*={0,2}$/.test(payload))
    throw new HttpError(400, 'extractFileContent received an invalid base64 data URL payload.')

  return {
    bytes: Buffer.from(payload, 'base64'),
    filename: `downloaded-file${extensionFromContentType(mimeType)}`,
  }
}

async function readResponseFile(response: Response, source: string): Promise<{ bytes: Buffer, filename: string }> {
  return {
    bytes: Buffer.from(await response.arrayBuffer()),
    filename: inferFilename(response, source),
  }
}

async function downloadWithAuth(args: ExtractFileContentArgs, getIntegration: (id: string) => { fetch: (path: string, init?: RequestInit) => Promise<Response> }): Promise<Response> {
  if (!args.integration)
    throw new HttpError(400, 'extractFileContent requires an exact integration id/reference when `auth` is true.')
  const integration = getIntegration(args.integration)
  return integration.fetch(args.source, { method: 'GET' })
}

async function downloadWithoutAuth(args: ExtractFileContentArgs): Promise<Response> {
  if (!isAbsoluteHttpUrl(args.source))
    throw new HttpError(400, 'extractFileContent requires an absolute http(s) URL or data URL when `auth` is false.')
  return fetch(args.source, { method: 'GET' })
}

export function createExtractFileContent(
  getIntegration: (id: string) => { fetch: (path: string, init?: RequestInit) => Promise<Response> },
  defaultIntegrationId?: string,
) {
  return async function extractFileContent(args: ExtractFileContentArgs): Promise<ExtractedFileContent> {
    if (!args || typeof args !== 'object')
      throw new HttpError(400, 'extractFileContent requires an object argument.')
    if (typeof args.auth !== 'boolean')
      throw new HttpError(400, 'extractFileContent requires `auth` to be a boolean.')
    if (!args.source || typeof args.source !== 'string')
      throw new HttpError(400, 'extractFileContent requires `source` to be a non-empty string.')

    const resolvedArgs = args.auth && !args.integration && defaultIntegrationId
      ? { ...args, integration: defaultIntegrationId }
      : args

    const capability = await getFileProcessingCapability()
    if (!capability.enabled)
      throw new HttpError(501, formatFileProcessingUnavailableMessage(capability))

    const downloaded = isDataUrl(resolvedArgs.source)
      ? (!resolvedArgs.auth
          ? parseDataUrl(resolvedArgs.source)
          : (() => { throw new HttpError(400, 'extractFileContent data URLs must use `auth: false`.') })())
      : await (async () => {
          const response = resolvedArgs.auth
            ? await downloadWithAuth(resolvedArgs, getIntegration)
            : await downloadWithoutAuth(resolvedArgs)

          if (!response.ok) {
            const bodyText = await response.text().catch(() => '')
            throw new HttpError(response.status, `Failed to download file (${response.status})${bodyText ? `: ${bodyText.slice(0, 500)}` : ''}.`)
          }

          return await readResponseFile(response, resolvedArgs.source)
        })()

    const tempDir = await mkdtemp(join(tmpdir(), 'commandable-extract-'))
    try {
      const filename = downloaded.filename
      const filePath = join(tempDir, filename)
      const outputPath = join(tempDir, 'result.json')
      await writeFile(filePath, downloaded.bytes)

      const pythonArgs = [extractorScriptPath(), '--input', filePath, '--output', outputPath]
      const previewPages = typeof resolvedArgs.previewPages === 'number' && resolvedArgs.previewPages > 0
        ? Math.floor(resolvedArgs.previewPages)
        : 0
      if (previewPages > 0)
        pythonArgs.push('--preview-pages', String(previewPages))

      await execFile(
        pythonExecutable(),
        pythonArgs,
        { cwd: tempDir, maxBuffer: 50 * 1024 * 1024 },
      )

      const raw = await readFile(outputPath, 'utf8')
      const parsed = JSON.parse(raw)
      return {
        kind: typeof parsed?.kind === 'string' ? parsed.kind : 'unknown',
        content: typeof parsed?.content === 'string' ? parsed.content : '',
        warnings: Array.isArray(parsed?.warnings) ? parsed.warnings.map((item: unknown) => String(item)) : undefined,
        metadata: parsed?.metadata && typeof parsed.metadata === 'object' ? parsed.metadata as Record<string, unknown> : undefined,
        pageImages: Array.isArray(parsed?.pageImages) ? parsed.pageImages.filter((v: unknown) => typeof v === 'string') : undefined,
      }
    }
    catch (error: any) {
      const stderr = typeof error?.stderr === 'string' ? error.stderr.trim() : ''
      const stdout = typeof error?.stdout === 'string' ? error.stdout.trim() : ''
      const detail = stderr || stdout || error?.message || 'Unknown extractor failure.'
      const capability = await getFileProcessingCapability()
      if (!capability.enabled)
        throw new HttpError(501, formatFileProcessingUnavailableMessage(capability))
      throw new HttpError(500, `Failed to extract file content. ${detail}`)
    }
    finally {
      await rm(tempDir, { recursive: true, force: true }).catch(() => {})
    }
  }
}
