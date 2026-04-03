import { existsSync } from 'node:fs'
import { execFile as execFileCb } from 'node:child_process'
import { resolve } from 'node:path'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import type { IntegrationData } from '../types.js'

const execFile = promisify(execFileCb)
const INSTALL_COMMAND = 'pip3 install -r packages/core/src/file-extractor/requirements.txt'
const DOCKER_HINT = 'Run Commandable with Docker to use the preinstalled extraction runtime.'

export type FileProcessingMode = 'auto' | 'on' | 'off'
export type FileProcessingReason =
  | 'disabled_by_env'
  | 'python_missing'
  | 'markitdown_missing'
  | 'extractor_script_missing'
  | 'probe_failed'

export interface FileProcessingCapability {
  enabled: boolean
  mode: FileProcessingMode
  reason?: FileProcessingReason
  message: string
  installCommand: string
  dockerHint: string
  pythonExecutable: string
  extractorScriptPath: string
}

const FILE_PROCESSING_DISABLED_TOOLS: Record<string, string[]> = {
  'google-workspace': ['read_file_content'],
}

let capabilityPromise: Promise<FileProcessingCapability> | null = null

export function pythonExecutable(): string {
  return process.env.COMMANDABLE_PYTHON || 'python3'
}

function extractorScriptCandidates(): string[] {
  const cwd = process.cwd()
  return [
    fileURLToPath(new URL('../file-extractor/extract_file.py', import.meta.url)),
    resolve(cwd, 'packages/core/src/file-extractor/extract_file.py'),
    resolve(cwd, 'packages/core/dist/file-extractor/extract_file.py'),
    resolve(cwd, 'node_modules/@commandable/mcp-core/dist/file-extractor/extract_file.py'),
    resolve(cwd, 'app/.output/server/node_modules/@commandable/mcp-core/dist/file-extractor/extract_file.py'),
  ]
}

export function extractorScriptPath(): string {
  const candidates = extractorScriptCandidates()
  return candidates.find(path => existsSync(path))
    || candidates[0]!
}

export function getFileProcessingMode(): FileProcessingMode {
  const raw = String(process.env.COMMANDABLE_FILE_PROCESSING || '').trim().toLowerCase()
  if (raw === 'off' || raw === '0' || raw === 'false' || raw === 'disabled')
    return 'off'
  if (raw === 'on' || raw === '1' || raw === 'true' || raw === 'enabled')
    return 'on'
  return 'auto'
}

function buildDisabledCapability(reason: FileProcessingReason, message: string): FileProcessingCapability {
  return {
    enabled: false,
    mode: getFileProcessingMode(),
    reason,
    message,
    installCommand: INSTALL_COMMAND,
    dockerHint: DOCKER_HINT,
    pythonExecutable: pythonExecutable(),
    extractorScriptPath: extractorScriptPath(),
  }
}

function buildEnabledCapability(): FileProcessingCapability {
  return {
    enabled: true,
    mode: getFileProcessingMode(),
    message: 'File processing is available.',
    installCommand: INSTALL_COMMAND,
    dockerHint: DOCKER_HINT,
    pythonExecutable: pythonExecutable(),
    extractorScriptPath: extractorScriptPath(),
  }
}

async function probeFileProcessing(): Promise<FileProcessingCapability> {
  const mode = getFileProcessingMode()
  if (mode === 'off') {
    return buildDisabledCapability(
      'disabled_by_env',
      'File processing is disabled by COMMANDABLE_FILE_PROCESSING=off.',
    )
  }

  const scriptPath = extractorScriptPath()
  if (!existsSync(scriptPath)) {
    return buildDisabledCapability(
      'extractor_script_missing',
      `File processing is unavailable because the extractor script was not found at ${scriptPath}.`,
    )
  }

  try {
    await execFile(pythonExecutable(), ['-c', 'import markitdown'])
    return buildEnabledCapability()
  }
  catch (error: any) {
    const code = String(error?.code || '').trim()
    const stderr = String(error?.stderr || '').trim()
    const stdout = String(error?.stdout || '').trim()
    const detail = stderr || stdout || String(error?.message || '').trim()

    if (code === 'ENOENT' || detail.includes('not found') || detail.includes('No such file')) {
      return buildDisabledCapability(
        'python_missing',
        `File processing requires Python 3, but '${pythonExecutable()}' was not found on this system.`,
      )
    }

    if (detail.includes('No module named') && detail.includes('markitdown')) {
      return buildDisabledCapability(
        'markitdown_missing',
        'File processing requires the Python package MarkItDown, but it is not installed for the configured Python runtime.',
      )
    }

    return buildDisabledCapability(
      'probe_failed',
      `File processing probe failed: ${detail || 'Unknown error.'}`,
    )
  }
}

export async function getFileProcessingCapability(): Promise<FileProcessingCapability> {
  capabilityPromise ||= probeFileProcessing()
  return capabilityPromise
}

export async function warmFileProcessingCapability(): Promise<FileProcessingCapability> {
  return await getFileProcessingCapability()
}

export function resetFileProcessingCapabilityForTests(): void {
  capabilityPromise = null
}

export function formatFileProcessingUnavailableMessage(capability: FileProcessingCapability): string {
  return [
    capability.message,
    `Install locally with: ${capability.installCommand}`,
    capability.dockerHint,
  ].join(' ')
}

export function applyFileProcessingCapabilityToIntegration(
  integration: IntegrationData,
  capability: FileProcessingCapability,
): IntegrationData {
  if (capability.enabled)
    return integration

  const blocked = FILE_PROCESSING_DISABLED_TOOLS[integration.type]
  if (!blocked?.length)
    return integration

  const merged = new Set([...(integration.disabledTools || []), ...blocked])
  return {
    ...integration,
    disabledTools: [...merged],
  }
}

export function applyFileProcessingCapabilityToIntegrations(
  integrations: IntegrationData[],
  capability: FileProcessingCapability,
): IntegrationData[] {
  return integrations.map(integration => applyFileProcessingCapabilityToIntegration(integration, capability))
}
