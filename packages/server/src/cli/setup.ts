import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import picocolors from 'picocolors'
import {
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
import { getCommandableDir, openLocalState } from './credentialManager.js'
import { listIntegrations, upsertIntegration } from '../db/integrationStore.js'
import type { IntegrationData } from '../types.js'

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
  const root = process.env.COMMANDABLE_INTEGRATION_DATA_DIR
    ? resolve(process.env.COMMANDABLE_INTEGRATION_DATA_DIR)
    : resolve(fileURLToPath(new URL('../../integration-data/', import.meta.url)))
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
    .filter(it => !!loadIntegrationCredentialConfig(it.type))
    .map(it => ({ value: it.type, label: formatIntegrationOption(it.type, it.name) }))
    .sort((a, b) => a.value.localeCompare(b.value))

  if (!options.length) {
    log.info('No locally-configurable integrations available yet.')
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

  const creds: Record<string, string> = {}
  for (const key of keys) {
    const isReq = required.includes(key)
    const def = props[key] || {}
    const title = isTruthyString(def?.title) ? def.title : key
    const description = (hint == null && isTruthyString(def?.description)) ? def.description : null

    const label = `${title}${isReq ? ' (required)' : ' (optional)'}`
    const message = description
      ? `${label} ${picocolors.dim(`— ${description}`)}`
      : label

    while (true) {
      const result = isProbablySecretKeyName(key)
        ? await password({ message })
        : await text({ message })

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

function makeClaudeDesktopSnippet() {
  return {
    mcpServers: {
      commandable: {
        command: 'npx',
        args: ['@commandable/mcp'],
      },
    },
  }
}

function makeIntegrationRecord(type: string): IntegrationData {
  return {
    spaceId: 'local',
    id: type,
    type,
    referenceId: type,
    label: type,
    connectionMethod: 'credentials',
    credentialId: `${type}-creds`,
  }
}

export async function runInitInteractive() {
  intro('Commandable MCP')

  const types = await selectIntegrations({
    title: 'Which integrations do you want to connect?',
  })
  if (types === null) {
    outro('Cancelled.')
    return
  }

  const { db, credentialStore, close } = await openLocalState()
  try {
    for (const type of types) {
      log.info(`Configuring ${picocolors.cyan(type)}`)
      const credentials = await promptCredentialsForIntegration(type)
      if (credentials === null) {
        outro('Cancelled.')
        return
      }

      const integration = makeIntegrationRecord(type)
      await credentialStore.saveCredentials('local', integration.credentialId!, credentials)
      await upsertIntegration(db, integration)
    }

    log.success(`Credentials saved (encrypted) to ${picocolors.dim(getCommandableDir())}`)
    log.info('Claude Desktop config snippet (plain JSON):')
    process.stdout.write(`${JSON.stringify(makeClaudeDesktopSnippet(), null, 2)}\n`)
  }
  finally {
    await close()
  }

  outro('You’re all set. Restart your MCP client and try a tool call.')
}

export async function runAddInteractive() {
  intro('Commandable MCP')

  const { db, credentialStore, close } = await openLocalState()
  try {
    const existing = await listIntegrations(db, 'local')
    const existingTypes = new Set(existing.map(i => i.type).filter(Boolean))

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

      const integration = makeIntegrationRecord(type)
      await credentialStore.saveCredentials('local', integration.credentialId!, credentials)
      await upsertIntegration(db, integration)
      added.push(type)
    }

    if (added.length)
      log.success(`Added: ${added.map(t => picocolors.cyan(t)).join(', ')}`)
    else
      log.info('Nothing to add.')
  }
  finally {
    await close()
  }

  outro('Done.')
}

