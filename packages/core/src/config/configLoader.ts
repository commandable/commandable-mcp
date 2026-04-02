import { existsSync, readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { cwd } from 'node:process'
import YAML from 'js-yaml'
import { CommandableConfigSchema, type CommandableConfig } from './configSchema.js'

export class ConfigError extends Error {
  override name = 'ConfigError'
}

function parseConfigFile(raw: string, filePath: string): any {
  if (filePath.endsWith('.json')) {
    try {
      return JSON.parse(raw)
    }
    catch (err: any) {
      throw new ConfigError(`Invalid JSON in config file: ${filePath}${err?.message ? ` (${err.message})` : ''}`)
    }
  }

  try {
    return YAML.load(raw)
  }
  catch (err: any) {
    throw new ConfigError(`Invalid YAML in config file: ${filePath}${err?.message ? ` (${err.message})` : ''}`)
  }
}

function resolveEnvRefs(value: any, filePath: string): any {
  if (typeof value === 'string') {
    return value.replace(/\$\{([A-Z0-9_]+)\}/g, (_m, name: string) => {
      const v = process.env[name]
      if (v == null || v === '')
        throw new ConfigError(`Missing environment variable ${name} referenced in ${filePath}`)
      return v
    })
  }
  if (Array.isArray(value))
    return value.map(v => resolveEnvRefs(v, filePath))
  if (value && typeof value === 'object') {
    const out: any = {}
    for (const [k, v] of Object.entries(value))
      out[k] = resolveEnvRefs(v, filePath)
    return out
  }
  return value
}

function findConfigPath(): string | null {
  const explicit = process.env.COMMANDABLE_CONFIG_FILE
  if (explicit && explicit.trim().length)
    return resolve(explicit.trim())

  const base = resolve(cwd())
  const candidates = [
    'commandable.config.yaml',
    'commandable.config.yml',
    'commandable.config.json',
  ].map(f => resolve(base, f))

  for (const p of candidates) {
    if (existsSync(p) && statSync(p).isFile())
      return p
  }
  return null
}

export function loadConfig(configPath?: string): { path: string, config: CommandableConfig } {
  const path = configPath?.trim().length ? resolve(configPath) : findConfigPath()
  if (!path)
    throw new ConfigError('No config file found. Provide --config <path> or set COMMANDABLE_CONFIG_FILE.')

  if (!existsSync(path))
    throw new ConfigError(`Config file not found: ${path}`)

  if (!statSync(path).isFile())
    throw new ConfigError(`Config path is not a file: ${path}`)

  const raw = readFileSync(path, 'utf8')
  const parsed = parseConfigFile(raw, path)
  const resolved = resolveEnvRefs(parsed, path)

  const result = CommandableConfigSchema.safeParse(resolved)
  if (!result.success) {
    throw new ConfigError(`Invalid config file: ${path}\n${result.error.toString()}`)
  }

  return { path, config: result.data }
}

