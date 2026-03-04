import picocolors from 'picocolors'
import crypto from 'node:crypto'
import { spawn } from 'node:child_process'
import { chmodSync, existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { IntegrationProxy } from '../integrations/proxy.js'
import { buildMcpToolIndex } from '../mcp/toolAdapter.js'
import { runStdioMcpServer } from '../mcp/server.js'
import { createApiKey, generateApiKey } from '../mcp/auth.js'
import { AbilityCatalog } from '../mcp/abilityCatalog.js'
import { SessionAbilityState } from '../mcp/sessionState.js'
import type { MetaToolContext } from '../mcp/metaTools.js'
import { getBuilderToolDefinitions } from '../mcp/metaTools.js'
import { COMMANDABLE_VERSION } from '../version.js'
import { runAddInteractive, runInitInteractive } from './setup.js'
import { getCommandableDir, getOrCreateEncryptionSecret, openLocalState } from './credentialManager.js'
import { listIntegrations } from '../db/integrationStore.js'
import { listCustomTools } from '../db/customToolStore.js'
import { createDbFromEnv } from '../db/client.js'
import { ensureSchema } from '../db/migrate.js'
import { SqlCredentialStore } from '../db/credentialStore.js'
import { applyConfig } from '../config/configApply.js'
import { loadConfig } from '../config/configLoader.js'
import { integrationDataRoot } from '../integrations/dataLoader.js'
import { buildExecutableToolFromCustomTool } from '../integrations/customToolFactory.js'

function hasFlag(...flags: string[]): boolean {
  return flags.some(f => process.argv.includes(f))
}

function resolveMode(): 'static' | 'create' {
  const explicit = (process.env.COMMANDABLE_MODE || '').toLowerCase().trim()
  if (explicit === 'create')
    return 'create'
  return 'static'
}

async function fetchJsonWithTimeout(url: string, timeoutMs: number): Promise<any> {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const resp = await fetch(url, { signal: controller.signal })
    const text = await resp.text()
    let json: any = null
    try { json = JSON.parse(text) } catch {}
    return { ok: resp.ok, status: resp.status, json, text }
  }
  finally {
    clearTimeout(t)
  }
}

function expectedUiIdentity(): { spaceId: string, db: { dialect: 'postgres' } | { dialect: 'sqlite', sqlitePath: string } } {
  const spaceId = (process.env.COMMANDABLE_SPACE_ID || 'local').trim() || 'local'
  const databaseUrl = process.env.DATABASE_URL
  if (databaseUrl && databaseUrl.trim().length)
    return { spaceId, db: { dialect: 'postgres' } }

  const forced = process.env.COMMANDABLE_MCP_SQLITE_PATH
  if (forced && forced.trim().length)
    return { spaceId, db: { dialect: 'sqlite', sqlitePath: resolve(forced.trim()) } }

  const dataDir = process.env.COMMANDABLE_DATA_DIR
  const sqlitePath = dataDir && dataDir.trim().length
    ? resolve(dataDir.trim(), 'credentials.sqlite')
    : resolve(homedir(), '.commandable', 'credentials.sqlite')
  return { spaceId, db: { dialect: 'sqlite', sqlitePath } }
}

async function waitForHttp(baseUrl: string, timeoutMs: number = 12_000): Promise<void> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const resp = await fetch(`${baseUrl}/api/_commandable/status`).catch(() => null)
      if (resp && resp.ok) {
        const data: any = await resp.json().catch(() => null)
        if (data?.service === 'commandable-management-ui' && data?.ok === true)
          return
      }
    }
    catch {}
    await new Promise(resolve => setTimeout(resolve, 150))
  }
  throw new Error(`Timed out waiting for management UI at ${baseUrl}`)
}

async function startBundledManagementUi(params: { port: number }): Promise<{ baseUrl: string, stop: () => Promise<void> } | null> {
  const port = params.port
  const baseUrl = `http://127.0.0.1:${port}`

  // If something is already listening, only reuse it if it's our UI and points
  // at the same local DB + space. Otherwise fail fast with a clear message to
  // avoid sending users to the wrong instance.
  try {
    const probe = await fetchJsonWithTimeout(`${baseUrl}/api/_commandable/status`, 400)
    if (probe?.ok) {
      const status: any = probe.json
      if (status?.service !== 'commandable-management-ui' || status?.ok !== true) {
        throw new Error(
          `Port ${port} is already in use by a non-Commandable service. ` +
          `Set COMMANDABLE_UI_PORT to a different port or stop the process using ${baseUrl}.`,
        )
      }

      const expected = expectedUiIdentity()
      const sameSpace = status?.spaceId === expected.spaceId
      const sameDialect = status?.db?.dialect === expected.db.dialect
      const sameSqlite = status?.db?.dialect !== 'sqlite' || expected.db.dialect !== 'sqlite'
        ? true
        : status?.db?.sqlitePath === expected.db.sqlitePath

      if (!sameSpace || !sameDialect || !sameSqlite) {
        const details = [
          `expected spaceId=${expected.spaceId}, got=${status?.spaceId}`,
          `expected dialect=${expected.db.dialect}, got=${status?.db?.dialect}`,
          expected.db.dialect === 'sqlite' ? `expected sqlitePath=${expected.db.sqlitePath}` : null,
          status?.db?.dialect === 'sqlite' ? `got sqlitePath=${status?.db?.sqlitePath}` : null,
        ].filter(Boolean).join(' | ')

        throw new Error(
          `A Commandable management UI is already running at ${baseUrl} but it does not match this session's DB/space (${details}). ` +
          `Stop the existing UI process or set COMMANDABLE_UI_PORT to avoid conflicts.`,
        )
      }

      const runningVersion = typeof status?.version === 'string' && status.version.trim().length ? status.version.trim() : null
      if (runningVersion !== COMMANDABLE_VERSION) {
        console.error(`[commandable] restarting management UI due to version mismatch (running=${runningVersion ?? 'unknown'}, installed=${COMMANDABLE_VERSION})`)
        const info = readDaemonPid()
        if (info?.pid && isProcessAlive(info.pid)) {
          try { process.kill(info.pid, 'SIGTERM') } catch {}
          try { unlinkSync(daemonPidPath()) } catch {}
          // Wait briefly for the port to be released.
          await new Promise(resolve => setTimeout(resolve, 250))
        }
        else {
          throw new Error(
            `A Commandable management UI is running at ${baseUrl} with version=${runningVersion ?? 'unknown'}, but the daemon PID could not be determined. ` +
            `Stop the process using ${baseUrl} (or change COMMANDABLE_UI_PORT) to continue.`,
          )
        }
      }

      console.error(`[commandable] reusing existing management UI at ${baseUrl}`)
      return { baseUrl, stop: async () => {} }
    }
    else if (probe?.status && probe.status !== 404) {
      throw new Error(
        `Port ${port} is already in use (HTTP ${probe.status}). ` +
        `Set COMMANDABLE_UI_PORT to a different port or stop the process using ${baseUrl}.`,
      )
    }
  }
  catch {
    // Connection refused / not reachable -> port is likely free; proceed to spawn.
  }

  const here = dirname(fileURLToPath(import.meta.url))
  // dist/cli/index.js -> dist/app/server/index.mjs
  const serverEntry = resolve(here, '..', 'app', 'server', 'index.mjs')
  const cwd = resolve(here, '..', 'app')

  if (!existsSync(serverEntry)) {
    console.error(`[commandable] bundled management UI not found at: ${serverEntry}`)
    console.error(`[commandable] create-mode will run without the UI; credentials links will be unavailable.`)
    return null
  }

  const execPath = existsSync(process.execPath) ? process.execPath : 'node'

  const child = spawn(execPath, [serverEntry], {
    cwd,
    env: {
      ...process.env,
      HOST: '127.0.0.1',
      PORT: String(port),
      COMMANDABLE_MODE: 'create',
      COMMANDABLE_VERSION,
      COMMANDABLE_INTEGRATION_DATA_DIR: process.env.COMMANDABLE_INTEGRATION_DATA_DIR || integrationDataRoot(),
      COMMANDABLE_MCP_SQLITE_PATH: process.env.COMMANDABLE_MCP_SQLITE_PATH || resolve(getCommandableDir(), 'credentials.sqlite'),
    },
    stdio: 'ignore',
    detached: true,
  })
  child.unref()

  const pidPath = resolve(getCommandableDir(), 'daemon.pid')
  try {
    // Format:
    // <pid>
    // <version>
    writeFileSync(pidPath, `${child.pid}\n${COMMANDABLE_VERSION}\n`, { mode: 0o600 })
    try { chmodSync(pidPath, 0o600) } catch {}
  }
  catch {}

  try {
    await waitForHttp(baseUrl)
  }
  catch (err: any) {
    console.error(`[commandable] management UI failed to start at ${baseUrl}`)
    console.error(err?.message || err)
    // Daemon start failed; attempt cleanup (best effort).
    try { process.kill(child.pid!, 'SIGTERM') } catch {}
    return null
  }

  return {
    baseUrl,
    stop: async () => {
      const pidFile = resolve(getCommandableDir(), 'daemon.pid')
      let pid: number | null = null
      try {
        const raw = readFileSync(pidFile, 'utf8')
        const first = raw.split('\n')[0]?.trim() || ''
        pid = first && /^\d+$/.test(first) ? Number(first) : null
      }
      catch {}
      if (pid) {
        try { process.kill(pid, 'SIGTERM') } catch {}
      }
      try { unlinkSync(pidFile) } catch {}
    },
  }
}

function daemonPidPath(): string {
  return resolve(getCommandableDir(), 'daemon.pid')
}

function readDaemonPid(): { pid: number, version: string | null } | null {
  try {
    const raw = readFileSync(daemonPidPath(), 'utf8')
    const lines = raw.split('\n').map(l => l.trim()).filter(Boolean)
    const pidRaw = lines[0] || ''
    const versionRaw = lines[1] || null
    const pid = pidRaw && /^\d+$/.test(pidRaw) ? Number(pidRaw) : null
    return pid ? { pid, version: versionRaw } : null
  }
  catch {
    return null
  }
}

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  }
  catch {
    return false
  }
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
    picocolors.dim(`v${COMMANDABLE_VERSION}`),
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
    `  ${picocolors.cyan('commandable-mcp --version')}`,
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
  const customTools = await listCustomTools(db, spaceId)

  const proxy = new IntegrationProxy({
    credentialStore,
    trelloApiKey: process.env.TRELLO_API_KEY,
  })

  const mode = forceMode ?? resolveMode()
  if (!integrations.length && mode !== 'create') {
    console.error(`No integrations configured yet. Run ${picocolors.cyan('commandable-mcp init')}.`)
    process.exit(0)
  }

  const integrationsRef = { current: integrations }
  const index = buildMcpToolIndex({ spaceId, integrations, proxy, integrationsRef })

  // Materialize persisted custom tools (agent-created) into the executable tool index.
  for (const t of customTools) {
    const integration = integrationsRef.current.find(i => i.id === t.integrationId)
    if (!integration)
      continue
    const executable = buildExecutableToolFromCustomTool({
      spaceId,
      integration,
      tool: t,
      proxy,
      integrationsRef,
    })
    if (!index.byName.has(executable.name)) {
      index.byName.set(executable.name, executable)
      index.tools.push({
        name: executable.name,
        description: executable.description,
        inputSchema: executable.inputSchema,
      })
    }
  }

  const toolIndex = { list: index.tools, byName: index.byName }

  const uiPortRaw = process.env.COMMANDABLE_UI_PORT
  const uiPort = uiPortRaw && /^\d+$/.test(uiPortRaw) ? Number(uiPortRaw) : 23432

  const managementUi = mode === 'create'
    ? await startBundledManagementUi({ port: uiPort })
    : null

  console.error(`[commandable] v${COMMANDABLE_VERSION}`)

  await runStdioMcpServer({
    serverInfo: { name: 'commandable', version: COMMANDABLE_VERSION },
    tools: toolIndex,
    ...(mode === 'create'
      ? {
          createMode: (() => {
            const builderDefs = getBuilderToolDefinitions()
            const extraToolDefinitions = new Map(builderDefs.map(d => [d.name, d]))
            const catalogRef = {
              current: new AbilityCatalog({
                integrations: integrationsRef.current,
                toolIndex: toolIndex.byName,
                extraToolDefinitions,
              }),
            }
            const sessionState = new SessionAbilityState()
            const ctx: MetaToolContext = {
              spaceId,
              db,
              credentialStore,
              proxy,
              credentialSetupBaseUrl: managementUi?.baseUrl,
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

  if (hasFlag('--version', '-v')) {
    console.error(COMMANDABLE_VERSION)
    process.exit(0)
  }

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

  if (cmd === 'daemon') {
    const sub = (process.argv[3] || '').trim().toLowerCase()
    const uiPortRaw = process.env.COMMANDABLE_UI_PORT
    const uiPort = uiPortRaw && /^\d+$/.test(uiPortRaw) ? Number(uiPortRaw) : 23432
    const baseUrl = `http://127.0.0.1:${uiPort}`

    if (sub === 'status' || !sub) {
      const pid = readDaemonPid()
      const alive = pid ? isProcessAlive(pid.pid) : false
      const probe = await fetchJsonWithTimeout(`${baseUrl}/api/_commandable/status`, 400).catch(() => null)
      const ok = !!probe?.ok
      const probeVersion = typeof probe?.json?.version === 'string' && probe.json.version.trim().length ? probe.json.version.trim() : null
      const runningVersion = probeVersion || pid?.version || null
      console.error(JSON.stringify({
        running: alive && ok,
        pid,
        baseUrl,
        installedVersion: COMMANDABLE_VERSION,
        runningVersion,
        versionMatch: !!runningVersion && runningVersion === COMMANDABLE_VERSION,
        status: probe?.json ?? null,
      }, null, 2))
      return
    }

    if (sub === 'stop') {
      const pid = readDaemonPid()
      if (pid) {
        try { process.kill(pid.pid, 'SIGTERM') } catch {}
      }
      try { unlinkSync(daemonPidPath()) } catch {}
      return
    }

    if (sub === 'start') {
      const ui = await startBundledManagementUi({ port: uiPort })
      if (!ui)
        throw new Error('Failed to start daemon')
      console.error(`Daemon running at ${baseUrl}`)
      return
    }

    help(1)
  }

  if (cmd && !cmd.startsWith('-'))
    help(1)

  return await runStdioFromDb()
}

