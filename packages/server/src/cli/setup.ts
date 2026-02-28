import picocolors from 'picocolors'
import {
  intro,
  isCancel,
  log,
  multiselect,
  note,
  outro,
  password,
  select,
  text,
} from '@clack/prompts'
import { listIntegrationCatalog } from '../integrations/catalog.js'
import { loadIntegrationCredentialConfig, loadIntegrationHint, loadIntegrationVariants } from '../integrations/dataLoader.js'
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

/**
 * Prompt the user to pick a credential variant for the given integration type.
 * If there is only one variant, auto-selects it without prompting.
 * Returns the selected variant key, or null if the user cancelled.
 */
async function selectCredentialVariant(type: string): Promise<string | null> {
  const variantsFile = loadIntegrationVariants(type)
  if (!variantsFile)
    return null

  const variantKeys = Object.keys(variantsFile.variants)

  if (variantKeys.length === 1) {
    return variantKeys[0]!
  }

  const options = variantKeys.map(key => ({
    value: key,
    label: variantsFile.variants[key]!.label,
    hint: key === variantsFile.default ? 'recommended' : undefined,
  }))

  const result = await select({
    message: `Select credential type for ${picocolors.cyan(type)}:`,
    options,
    initialValue: variantsFile.default,
  })

  if (isCancel(result))
    return null

  return result as string
}

async function promptCredentialsForVariant(
  type: string,
  variantKey: string,
): Promise<Record<string, string> | null> {
  const credCfg = loadIntegrationCredentialConfig(type, variantKey)
  const schema = credCfg?.schema
  if (!schema || typeof schema !== 'object')
    return {}

  const props = (schema as any).properties || {}
  const required: string[] = Array.isArray((schema as any).required) ? (schema as any).required : []
  const keys = Object.keys(props)
  if (!keys.length)
    return {}

  const hint = loadIntegrationHint(type, variantKey)
  if (hint) {
    note(hint, `${type} (${variantKey}): setup hint`)
  }
  else {
    log.info(picocolors.dim(`No setup hint found for ${type}/${variantKey}.`))
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

async function selectIntegrations(args: { title: string, excludeTypes?: Set<string> }): Promise<string[] | null> {
  const catalog = listIntegrationCatalog()
  const options = catalog
    .filter(it => !args.excludeTypes?.has(it.type))
    .filter(it => !!loadIntegrationVariants(it.type))
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

  return (selected as string[]).map(s => String(s)).filter(Boolean)
}

function makeClaudeDesktopSnippet() {
  return {
    mcpServers: {
      commandable: {
        command: 'npx',
        args: ['-y', '@commandable/mcp'],
      },
    },
  }
}

function makeIntegrationRecord(type: string, variantKey: string): IntegrationData {
  return {
    spaceId: 'local',
    id: type,
    type,
    referenceId: type,
    label: type,
    connectionMethod: 'credentials',
    credentialId: `${type}-creds`,
    credentialVariant: variantKey,
  }
}

async function configureIntegration(type: string): Promise<{ variantKey: string, credentials: Record<string, string> } | null> {
  log.info(`Configuring ${picocolors.cyan(type)}`)

  const variantKey = await selectCredentialVariant(type)
  if (variantKey === null)
    return null

  const variantsFile = loadIntegrationVariants(type)
  if (variantsFile && Object.keys(variantsFile.variants).length > 1) {
    log.info(`Using: ${picocolors.cyan(variantsFile.variants[variantKey]?.label ?? variantKey)}`)
  }

  const credentials = await promptCredentialsForVariant(type, variantKey)
  if (credentials === null)
    return null

  return { variantKey, credentials }
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
      const result = await configureIntegration(type)
      if (result === null) {
        outro('Cancelled.')
        return
      }

      const { variantKey, credentials } = result
      const integration = makeIntegrationRecord(type, variantKey)
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

  outro('You\'re all set. Restart your MCP client and try a tool call.')
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
      const result = await configureIntegration(type)
      if (result === null) {
        outro('Cancelled.')
        return
      }

      const { variantKey, credentials } = result
      const integration = makeIntegrationRecord(type, variantKey)
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
