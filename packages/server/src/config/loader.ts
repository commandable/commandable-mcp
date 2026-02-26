import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export type CommandableConfig = {
  integrationDataDir?: string
  spaceId?: string
  integrations: Array<{
    type: string
    label?: string
    referenceId?: string
    credentials?: Record<string, string>
    config?: Record<string, any>
  }>
}

function warnOnPlaintextCredentials(parsedConfig: any) {
  const integrations = parsedConfig?.integrations
  if (!Array.isArray(integrations))
    return

  const offenders: string[] = []
  for (const i of integrations) {
    const type = i?.type
    const creds = i?.credentials
    if (!type || !creds || typeof creds !== 'object')
      continue

    for (const v of Object.values(creds)) {
      if (typeof v !== 'string')
        continue
      if (!v.startsWith('env:')) {
        offenders.push(String(type))
        break
      }
    }
  }

  if (!offenders.length)
    return

  const unique = Array.from(new Set(offenders)).sort()
  console.error(
    `[commandable-mcp] Warning: plaintext credentials found in config for: ${unique.join(', ')}. ` +
    `Move secrets to encrypted storage by running 'commandable-mcp init' (recommended), or use env:VARNAME placeholders.`,
  )
}

function resolveEnvPlaceholders(value: any): any {
  if (Array.isArray(value))
    return value.map(resolveEnvPlaceholders)
  if (!value || typeof value !== 'object') {
    if (typeof value === 'string' && value.startsWith('env:')) {
      const key = value.slice('env:'.length)
      const v = process.env[key]
      if (v === undefined)
        throw new Error(`Missing required env var: ${key}`)
      return v
    }
    return value
  }
  const out: any = {}
  for (const [k, v] of Object.entries(value))
    out[k] = resolveEnvPlaceholders(v)
  return out
}

export function loadCommandableConfig(path: string): CommandableConfig {
  let abs = resolve(process.cwd(), path)
  // If a user accidentally references an editor backup file (e.g. commandable.json~),
  // fall back to the non-suffixed path when it exists.
  if (!existsSync(abs) && abs.endsWith('~')) {
    const without = abs.slice(0, -1)
    if (existsSync(without))
      abs = without
  }
  const raw = readFileSync(abs, 'utf8')
  const parsed = JSON.parse(raw)
  warnOnPlaintextCredentials(parsed)
  const resolved = resolveEnvPlaceholders(parsed)
  return resolved as CommandableConfig
}

