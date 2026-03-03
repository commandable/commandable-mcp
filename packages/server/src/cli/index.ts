import picocolors from 'picocolors'
import crypto from 'node:crypto'
import { IntegrationProxy } from '../integrations/proxy.js'
import { buildMcpToolIndex } from '../mcp/toolAdapter.js'
import { runStdioMcpServer } from '../mcp/server.js'
import { createApiKey, generateApiKey } from '../mcp/auth.js'
import { AbilityCatalog } from '../mcp/abilityCatalog.js'
import { SessionAbilityState } from '../mcp/sessionState.js'
import type { MetaToolContext } from '../mcp/metaTools.js'
import { startCredentialServer } from '../web/credentialServer.js'
import { runAddInteractive, runInitInteractive } from './setup.js'
import { getOrCreateEncryptionSecret, openLocalState } from './credentialManager.js'
import { listIntegrations } from '../db/integrationStore.js'
import { createDbFromEnv } from '../db/client.js'
import { ensureSchema } from '../db/migrate.js'
import { SqlCredentialStore } from '../db/credentialStore.js'
import { applyConfig } from '../config/configApply.js'
import { loadConfig } from '../config/configLoader.js'

function hasFlag(...flags: string[]): boolean {
  return flags.some(f => process.argv.includes(f))
}

function resolveMode(): 'static' | 'create' {
  const explicit = (process.env.COMMANDABLE_MODE || '').toLowerCase().trim()
  if (explicit === 'create')
    return 'create'
  return 'static'
}

function getFlagValue(flag: string): string | null {
  const idx = process.argv.indexOf(flag)
  if (idx === -1)
    return null
  const val = process.argv[idx + 1]
  if (!val || val.startsWith('-'))
    return null
  return val
}

function help(exitCode: number = 0): never {
  const lines = [
    '',
    `${picocolors.bold('Commandable MCP')} — connect your apps to MCP clients`,
    '',
    picocolors.bold('Usage'),
    `  ${picocolors.cyan('commandable-mcp init')}`,
    `  ${picocolors.cyan('commandable-mcp init')} ${picocolors.dim('--config ./commandable.config.yaml')}`,
    `  ${picocolors.cyan('commandable-mcp add')}`,
    `  ${picocolors.cyan('commandable-mcp status')}`,
    `  ${picocolors.cyan('commandable-mcp apply')} ${picocolors.dim('[--config ./commandable.config.yaml]')}`,
    `  ${picocolors.cyan('commandable-mcp create-api-key')} ${picocolors.dim('[name]')}`,
    `  ${picocolors.cyan('commandable-mcp')} ${picocolors.dim('(start MCP server, static mode)')}`,
    `  ${picocolors.cyan('commandable-mcp create-mode')} ${picocolors.dim('(start MCP server in create mode — for use with Claude Code)')}`,
    '',
    picocolors.bold('Notes'),
    `- Credentials entered via the CLI are stored encrypted at ${picocolors.dim('~/.commandable/')} (override with ${picocolors.cyan('COMMANDABLE_DATA_DIR')}).`,
    `- Static mode: all tools available at startup. Works with every MCP client.`,
    `- Create mode: per-session dynamic toolsets via meta-tools. Requires ${picocolors.cyan('notifications/tools/list_changed')} support (e.g. Claude Code).`,
    '',
  ]
  console.error(lines.join('\n'))
  process.exit(exitCode)
}

async function runStdioFromDb(forceMode?: 'static' | 'create') {
  const spaceId = process.env.COMMANDABLE_SPACE_ID || 'local'
  const { db, credentialStore } = await openLocalState()
  const integrations = await listIntegrations(db, spaceId)

  if (!integrations.length) {
    console.error(`No integrations configured yet. Run ${picocolors.cyan('commandable-mcp init')}.`)
    process.exit(0)
  }

  const proxy = new IntegrationProxy({
    credentialStore,
    trelloApiKey: process.env.TRELLO_API_KEY,
  })

  const integrationsRef = { current: integrations }
  const index = buildMcpToolIndex({ spaceId, integrations, proxy, integrationsRef })
  const toolIndex = { list: index.tools, byName: index.byName }

  const mode = forceMode ?? resolveMode()
  const credentialPortRaw = process.env.COMMANDABLE_CREDENTIAL_PORT
  const credentialPort = credentialPortRaw && /^\d+$/.test(credentialPortRaw) ? Number(credentialPortRaw) : 23432

  const credentialServer = mode === 'create'
    ? await startCredentialServer({
        host: '127.0.0.1',
        port: credentialPort,
        spaceId,
        db,
        credentialStore,
        integrationsRef,
      })
    : null

  if (credentialServer) {
    let shuttingDown = false
    const cleanup = async () => {
      if (shuttingDown) return
      shuttingDown = true
      try { await credentialServer.close() } catch {}
    }
    process.on('SIGINT', () => { void cleanup().then(() => process.exit(0)) })
    process.on('SIGTERM', () => { void cleanup().then(() => process.exit(0)) })
    process.on('exit', () => { void cleanup() })
  }

  await runStdioMcpServer({
    serverInfo: { name: 'commandable', version: '0.0.1' },
    tools: toolIndex,
    ...(mode === 'create'
      ? {
          createMode: (() => {
            const catalogRef = { current: new AbilityCatalog({ integrations: integrationsRef.current, toolIndex: toolIndex.byName }) }
            const sessionState = new SessionAbilityState()
            const ctx: MetaToolContext = {
              spaceId,
              db,
              credentialStore,
              proxy,
              credentialSetupBaseUrl: credentialServer?.baseUrl,
              integrationsRef,
              toolIndexRef: toolIndex,
              catalogRef,
            }
            return { catalogRef, sessionState, ctx }
          })(),
        }
      : {}),
  })
}

async function openEnvState(): Promise<{ db: any, credentialStore: SqlCredentialStore, close: () => Promise<void> }> {
  const db = createDbFromEnv()
  await ensureSchema(db)
  const secret = getOrCreateEncryptionSecret()
  const credentialStore = new SqlCredentialStore(db, secret)
  return {
    db,
    credentialStore,
    close: async () => {
      if (db.dialect === 'sqlite')
        db.close()
      else
        await db.close()
    },
  }
}

async function runApplyHeadless() {
  const cfgPath = getFlagValue('--config') || process.env.COMMANDABLE_CONFIG_FILE || null
  const { config, path } = loadConfig(cfgPath || undefined)

  const spaceId = process.env.COMMANDABLE_SPACE_ID || config.spaceId || 'local'
  const { db, credentialStore, close } = await openEnvState()
  try {
    const res = await applyConfig({ config, db, credentialStore, defaultSpaceId: spaceId })
    console.error(`${picocolors.green('Config applied.')}`)
    console.error(`${picocolors.dim('File:')} ${path}`)
    console.error(`${picocolors.dim('Space:')} ${res.spaceId}`)
    console.error(`${picocolors.dim('Integrations upserted:')} ${res.integrationsUpserted}`)
    console.error(`${picocolors.dim('Credentials written:')} ${res.credentialsWritten}`)
    console.error(`${picocolors.dim('Credentials unchanged:')} ${res.credentialsUnchanged}`)
  }
  finally {
    await close()
  }
}

async function runCreateApiKey() {
  const name = process.argv[3] && !process.argv[3].startsWith('-') ? String(process.argv[3]) : 'default'
  const rawKey = generateApiKey()
  const id = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex')

  const { db, close } = await openEnvState()
  try {
    await createApiKey(db, { id, name, rawKey })
    console.error(`${picocolors.green('API key created.')}`)
    console.error(`${picocolors.dim('Name:')} ${name}`)
    console.error(`${picocolors.dim('ID:')} ${id}`)
    console.error(`${picocolors.dim('Key (store this now):')} ${rawKey}`)
  }
  finally {
    await close()
  }
}

export async function main() {
  const cmd = process.argv[2]

  if (hasFlag('--help', '-h'))
    help(0)

  if (cmd === 'init') {
    const cfgPath = getFlagValue('--config') || process.env.COMMANDABLE_CONFIG_FILE || null
    if (cfgPath)
      return await runApplyHeadless()
    return await runInitInteractive()
  }

  if (cmd === 'add')
    return await runAddInteractive()

  if (cmd === 'status') {
    const { db, close } = await openLocalState()
    try {
      const items = await listIntegrations(db, 'local')
      if (!items.length) {
        console.error('No integrations configured.')
        return
      }
      console.error('Enabled integrations:')
      for (const it of items)
        console.error(`- ${it.type}`)
      return
    }
    finally {
      await close()
    }
  }

  if (cmd === 'apply')
    return await runApplyHeadless()

  if (cmd === 'create-api-key')
    return await runCreateApiKey()

  if (cmd === 'create-mode')
    return await runStdioFromDb('create')

  if (cmd && !cmd.startsWith('-'))
    help(1)

  return await runStdioFromDb()
}

