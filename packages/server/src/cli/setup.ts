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
import { loadIntegrationCredentialConfig, loadIntegrationHint, loadIntegrationToolsets, loadIntegrationVariants } from '../integrations/dataLoader.js'
import { getCommandableDir, openLocalState } from './credentialManager.js'
import { listIntegrations, upsertIntegration } from '../db/integrationStore.js'
import type { IntegrationData } from '../types.js'

function isTruthyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

/**
 * Strips markdown syntax for plain-terminal display and word-wraps lines
 * that exceed maxWidth so clack's note() box doesn't overflow narrow terminals.
 */
function formatHintForTerminal(text: string, maxWidth = 60): string {
  const stripped = text
    .replace(/\*\*(.+?)\*\*/g, '$1') // **bold** → bold
    .replace(/\*(.+?)\*/g, '$1') // *italic* → italic
    .replace(/`([^`]+)`/g, '$1') // `code` → code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [text](url) → text

  return stripped
    .split('\n')
    .map((line) => {
      if (line.length <= maxWidth)
        return line
      // Wrap at word boundaries
      const words = line.split(' ')
      const wrapped: string[] = []
      let current = ''
      // Preserve leading indent/list prefix on continuation lines
      const indent = /^(\s*(?:\d+\.\s|\*\s|-\s)?)/.exec(line)?.[1]?.replace(/\S/g, ' ') ?? ''
      for (const word of words) {
        if (!current) {
          current = word
        }
        else if ((current + ' ' + word).length <= maxWidth) {
          current += ' ' + word
        }
        else {
          wrapped.push(current)
          current = indent + word
        }
      }
      if (current)
        wrapped.push(current)
      return wrapped.join('\n')
    })
    .join('\n')
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
    note(formatHintForTerminal(hint), `${type} (${variantKey}): setup hint`)
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

async function selectMaxScope(): Promise<'read' | null | undefined> {
  const result = await select({
    message: 'What level of access should this integration have?',
    options: [
      { value: 'all', label: 'Read + Write', hint: 'Full access — the AI can read and make changes' },
      { value: 'read', label: 'Read-only', hint: 'The AI can only read data, never write or delete' },
    ],
    initialValue: 'all',
  })

  if (isCancel(result))
    return null

  return result === 'read' ? 'read' : undefined
}

async function selectEnabledToolsets(type: string): Promise<string[] | undefined | null> {
  const toolsets = loadIntegrationToolsets(type)
  if (!toolsets)
    return undefined

  const entries = Object.entries(toolsets)
  if (!entries.length)
    return undefined

  const options = entries
    .map(([key, meta]) => ({
      value: key,
      label: meta.label,
      hint: meta.description,
    }))
    .sort((a, b) => a.value.localeCompare(b.value))
  const result = await multiselect({
    message: `Which tool groups do you want to enable for ${picocolors.cyan(type)}?`,
    options,
    initialValues: options.map(o => o.value),
    required: true,
  })
  if (isCancel(result))
    return null
  return (result as string[]).map(s => String(s)).filter(Boolean)
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

function makeIntegrationRecord(type: string, variantKey: string, enabledToolsets?: string[], maxScope?: 'read' | null): IntegrationData {
  return {
    spaceId: 'local',
    id: type,
    type,
    referenceId: type,
    label: type,
    connectionMethod: 'credentials',
    credentialId: `${type}-creds`,
    credentialVariant: variantKey,
    enabledToolsets,
    maxScope: maxScope ?? null,
  }
}

async function configureIntegration(type: string): Promise<{ variantKey: string, credentials: Record<string, string>, enabledToolsets?: string[], maxScope?: 'read' | null } | null> {
  log.info(`Configuring ${picocolors.cyan(type)}`)

  const variantKey = await selectCredentialVariant(type)
  if (variantKey === null)
    return null

  const variantsFile = loadIntegrationVariants(type)
  if (variantsFile && Object.keys(variantsFile.variants).length > 1) {
    log.info(`Using: ${picocolors.cyan(variantsFile.variants[variantKey]?.label ?? variantKey)}`)
  }

  const enabledToolsets = await selectEnabledToolsets(type)
  if (enabledToolsets === null)
    return null

  const maxScope = await selectMaxScope()
  if (maxScope === null)
    return null

  const credentials = await promptCredentialsForVariant(type, variantKey)
  if (credentials === null)
    return null

  return { variantKey, credentials, enabledToolsets: enabledToolsets ?? undefined, maxScope }
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

      const { variantKey, credentials, enabledToolsets, maxScope } = result
      const integration = makeIntegrationRecord(type, variantKey, enabledToolsets, maxScope)
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

      const { variantKey, credentials, enabledToolsets, maxScope } = result
      const integration = makeIntegrationRecord(type, variantKey, enabledToolsets, maxScope)
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
