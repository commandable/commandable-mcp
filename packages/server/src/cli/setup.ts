import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import picocolors from 'picocolors'
import {
  confirm,
  intro,
  isCancel,
  log,
  multiselect,
  note,
  outro,
  password,
  text,
} from '@clack/prompts'
import { listIntegrationCatalog } from '../integrations/catalog.js'
import { loadIntegrationCredentialConfig } from '../integrations/dataLoader.js'
import type { CommandableConfig } from '../config/loader.js'
import { getCommandableDir, saveIntegrationCredentials } from './credentialManager.js'

function parseJsonFile(path: string): any {
  const raw = readFileSync(path, 'utf8')
  return JSON.parse(raw)
}

function isTruthyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

function isProbablySecretKeyName(key: string): boolean {
  const k = key.toLowerCase()
  return k.includes('token') || k.includes('secret') || k.includes('password') || k.endsWith('key') || k.includes('apikey')
}

function formatIntegrationOption(type: string, name?: string): string {
  if (!name || name === type)
    return type
  return `${type} ${picocolors.dim(`(${name})`)}`
}

function getIntegrationHintMarkdown(type: string): string | null {
  const root = process.env.COMMANDABLE_INTEGRATION_DATA_DIR || resolve(process.cwd(), 'integration-data')
  const hintPath = resolve(root, type, 'credentials_hint.md')
  if (!existsSync(hintPath))
    return null
  try {
    const hint = readFileSync(hintPath, 'utf8').trim()
    return hint.length ? hint : null
  }
  catch {
    return null
  }
}

async function selectIntegrations(args: { title: string, excludeTypes?: Set<string> }): Promise<string[] | null> {
  const catalog = listIntegrationCatalog()
  const options = catalog
    .filter(it => !args.excludeTypes?.has(it.type))
    .map(it => ({ value: it.type, label: formatIntegrationOption(it.type, it.name) }))
    .sort((a, b) => a.value.localeCompare(b.value))

  if (!options.length) {
    log.info('No integrations available to select.')
    return []
  }

  const selected = await multiselect({
    message: args.title,
    options,
    required: true,
  })

  if (isCancel(selected))
    return null

  const types = (selected as string[]).map(s => String(s)).filter(Boolean)
  return types
}

async function promptCredentialsForIntegration(type: string): Promise<Record<string, string> | null> {
  const credCfg = loadIntegrationCredentialConfig(type)
  const schema = credCfg?.schema
  if (!schema || typeof schema !== 'object')
    return {}

  const props = (schema as any).properties || {}
  const required: string[] = Array.isArray((schema as any).required) ? (schema as any).required : []
  const keys = Object.keys(props)
  if (!keys.length)
    return {}

  const hint = getIntegrationHintMarkdown(type)
  if (hint) {
    note(hint, `${type}: setup hint`)
  }
  else {
    log.info(picocolors.dim(`No setup hint found for ${type}.`))
  }

  log.info(picocolors.dim('Tip: you can enter env:VARNAME to read from your environment at runtime.'))

  const creds: Record<string, string> = {}
  for (const key of keys) {
    const isReq = required.includes(key)
    const def = props[key] || {}
    const title = isTruthyString(def?.title) ? def.title : key
    const description = isTruthyString(def?.description) ? def.description : null

    const label = `${title}${isReq ? ' (required)' : ' (optional)'}`

    if (description)
      log.info(picocolors.dim(description))

    while (true) {
      const result = isProbablySecretKeyName(key)
        ? await password({ message: label })
        : await text({ message: label })

      if (isCancel(result))
        return null

      const value = String(result ?? '').trim()
      if (!value) {
        if (isReq) {
          log.error(`${picocolors.cyan(title)} is required.`)
          continue
        }
        break
      }
      creds[key] = value
      break
    }
  }

  return creds
}

function writeConfigFile(path: string, cfg: CommandableConfig) {
  const absOut = resolve(process.cwd(), path)
  mkdirSync(dirname(absOut), { recursive: true })
  writeFileSync(absOut, `${JSON.stringify(cfg, null, 2)}\n`)
  return absOut
}

function makeClaudeDesktopSnippet(absConfigPath: string) {
  return {
    mcpServers: {
      commandable: {
        command: 'npx',
        args: ['@commandable/mcp', '--config', absConfigPath],
      },
    },
  }
}

export async function runInitInteractive(outPath: string) {
  intro('Commandable MCP')

  const absOut = resolve(process.cwd(), outPath)
  if (existsSync(absOut)) {
    const overwrite = await confirm({
      message: `Config already exists at ${picocolors.dim(absOut)}. Overwrite?`,
      initialValue: false,
    })
    if (isCancel(overwrite)) {
      outro('Cancelled.')
      return
    }
    if (!overwrite) {
      outro(`No changes made. Tip: run ${picocolors.cyan('commandable-mcp add --config')} to add integrations.`)
      return
    }
  }

  const types = await selectIntegrations({
    title: 'Which integrations do you want to connect?',
  })
  if (types === null) {
    outro('Cancelled.')
    return
  }

  const integrations: CommandableConfig['integrations'] = []
  for (const type of types) {
    log.info(`Configuring ${picocolors.cyan(type)}`)
    const credentials = await promptCredentialsForIntegration(type)
    if (credentials === null) {
      outro('Cancelled.')
      return
    }
    if (Object.keys(credentials).length) {
      const spaceId = 'local'
      const credentialId = `${type}-creds`
      await saveIntegrationCredentials(spaceId, credentialId, credentials)
    }

    integrations.push({ type })
  }

  const cfg: CommandableConfig = {
    integrationDataDir: './integration-data',
    spaceId: 'local',
    integrations,
  }

  const writtenAbs = writeConfigFile(outPath, cfg)

  log.success(`Config saved to ${picocolors.dim(writtenAbs)}`)
  log.success(`Credentials saved (encrypted) to ${picocolors.dim(getCommandableDir())}`)

  note(
    JSON.stringify(makeClaudeDesktopSnippet(writtenAbs), null, 2),
    'Claude Desktop config snippet',
  )

  outro('You’re all set. Restart your MCP client and try a tool call.')
}

export async function runAddInteractive(configPath: string) {
  intro('Commandable MCP')

  const absCfg = resolve(process.cwd(), configPath)
  if (!existsSync(absCfg)) {
    outro(`Config not found at ${picocolors.dim(absCfg)}. Run ${picocolors.cyan('commandable-mcp init')} first.`)
    return
  }

  let cfg: CommandableConfig
  try {
    cfg = parseJsonFile(absCfg) as CommandableConfig
  }
  catch (err) {
    outro(`Failed to read config JSON at ${picocolors.dim(absCfg)}.`)
    throw err
  }

  cfg.integrations = Array.isArray(cfg.integrations) ? cfg.integrations : []
  const existingTypes = new Set(cfg.integrations.map(i => i.type).filter(Boolean))

  const types = await selectIntegrations({
    title: 'Which integrations do you want to add?',
    excludeTypes: existingTypes,
  })
  if (types === null) {
    outro('Cancelled.')
    return
  }

  const added: string[] = []
  for (const type of types) {
    log.info(`Configuring ${picocolors.cyan(type)}`)
    const credentials = await promptCredentialsForIntegration(type)
    if (credentials === null) {
      outro('Cancelled.')
      return
    }
    if (Object.keys(credentials).length) {
      const spaceId = cfg.spaceId || 'local'
      const credentialId = `${type}-creds`
      await saveIntegrationCredentials(spaceId, credentialId, credentials)
    }

    cfg.integrations.push({ type })
    added.push(type)
  }

  writeFileSync(absCfg, `${JSON.stringify(cfg, null, 2)}\n`)

  if (added.length)
    log.success(`Added: ${added.map(t => picocolors.cyan(t)).join(', ')}`)
  else
    log.info('Nothing to add.')

  outro('Done.')
}

