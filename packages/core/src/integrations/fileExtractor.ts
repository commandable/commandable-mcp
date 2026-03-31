import { promisify } from 'node:util'
import { execFile as execFileCb } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { HttpError } from '../errors/httpError.js'

const execFile = promisify(execFileCb)

export interface ExtractFileContentArgs {
  auth: boolean
  source: string
  integration?: string
}

export interface ExtractedFileContent {
  kind: string
  content: string
  warnings?: string[]
  metadata?: Record<string, unknown>
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

function pythonExecutable(): string {
  return process.env.COMMANDABLE_PYTHON || 'python3'
}

function extractorScriptPath(): string {
  return fileURLToPath(new URL('../file-extractor/extract_file.py', import.meta.url))
}

async function downloadWithAuth(args: ExtractFileContentArgs, getIntegration: (id: string) => { fetch: (path: string, init?: RequestInit) => Promise<Response> }): Promise<Response> {
  if (!args.integration)
    throw new HttpError(400, 'extractFileContent requires `integration` when `auth` is true.')
  const integration = getIntegration(args.integration)
  return integration.fetch(args.source, { method: 'GET' })
}

async function downloadWithoutAuth(args: ExtractFileContentArgs): Promise<Response> {
  if (!isAbsoluteHttpUrl(args.source))
    throw new HttpError(400, 'extractFileContent requires an absolute http(s) URL when `auth` is false.')
  return fetch(args.source, { method: 'GET' })
}

export function createExtractFileContent(
  getIntegration: (id: string) => { fetch: (path: string, init?: RequestInit) => Promise<Response> },
) {
  return async function extractFileContent(args: ExtractFileContentArgs): Promise<ExtractedFileContent> {
    if (!args || typeof args !== 'object')
      throw new HttpError(400, 'extractFileContent requires an object argument.')
    if (typeof args.auth !== 'boolean')
      throw new HttpError(400, 'extractFileContent requires `auth` to be a boolean.')
    if (!args.source || typeof args.source !== 'string')
      throw new HttpError(400, 'extractFileContent requires `source` to be a non-empty string.')

    const response = args.auth
      ? await downloadWithAuth(args, getIntegration)
      : await downloadWithoutAuth(args)

    if (!response.ok) {
      const bodyText = await response.text().catch(() => '')
      throw new HttpError(response.status, `Failed to download file (${response.status})${bodyText ? `: ${bodyText.slice(0, 500)}` : ''}.`)
    }

    const tempDir = await mkdtemp(join(tmpdir(), 'commandable-extract-'))
    try {
      const filename = inferFilename(response, args.source)
      const filePath = join(tempDir, filename)
      const outputPath = join(tempDir, 'result.json')
      const bytes = Buffer.from(await response.arrayBuffer())
      await writeFile(filePath, bytes)

      await execFile(
        pythonExecutable(),
        [extractorScriptPath(), '--input', filePath, '--output', outputPath],
        { cwd: tempDir, maxBuffer: 10 * 1024 * 1024 },
      )

      const raw = await readFile(outputPath, 'utf8')
      const parsed = JSON.parse(raw)
      return {
        kind: typeof parsed?.kind === 'string' ? parsed.kind : 'unknown',
        content: typeof parsed?.content === 'string' ? parsed.content : '',
        warnings: Array.isArray(parsed?.warnings) ? parsed.warnings.map((item: unknown) => String(item)) : undefined,
        metadata: parsed?.metadata && typeof parsed.metadata === 'object' ? parsed.metadata as Record<string, unknown> : undefined,
      }
    }
    catch (error: any) {
      const stderr = typeof error?.stderr === 'string' ? error.stderr.trim() : ''
      const stdout = typeof error?.stdout === 'string' ? error.stdout.trim() : ''
      const detail = stderr || stdout || error?.message || 'Unknown extractor failure.'
      throw new HttpError(500, `Failed to extract file content. ${detail}`)
    }
    finally {
      await rm(tempDir, { recursive: true, force: true }).catch(() => {})
    }
  }
}
