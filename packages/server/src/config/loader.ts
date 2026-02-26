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
  const resolved = resolveEnvPlaceholders(parsed)
  return resolved as CommandableConfig
}

