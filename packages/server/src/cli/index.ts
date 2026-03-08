import picocolors from 'picocolors'
import crypto from 'node:crypto'
import { spawn, spawnSync } from 'node:child_process'
import { chmodSync, existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isCancel, note, select } from '@clack/prompts'
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
import { listToolDefinitions } from '../db/toolDefinitionStore.js'
import { listIntegrationTypeConfigs } from '../db/integrationTypeConfigStore.js'
import { createDbFromEnv } from '../db/client.js'
import { ensureSchema } from '../db/migrate.js'
import { SqlCredentialStore } from '../db/credentialStore.js'
import { applyConfig } from '../config/configApply.js'
import { loadConfig } from '../config/configLoader.js'
import { integrationDataRoot } from '../integrations/dataLoader.js'

type CommandableSource = 'package' | 'local'
type CommandableTransport = 'stdio' | 'http'
type ReadClient = 'claude-desktop' | 'cursor'

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

async function startBundledManagementUi(params: { port: number }): Promise<{ baseUrl: string, stop: () => Promise<void>, reused: boolean } | null> {
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
      return { baseUrl, stop: async () => {}, reused: true }
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
    reused: false,
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

function getUiPort(): number {
  const uiPortRaw = process.env.COMMANDABLE_UI_PORT
  return uiPortRaw && /^\d+$/.test(uiPortRaw) ? Number(uiPortRaw) : 23432
}

function getSqlitePathForLocalState(): string {
  const forced = process.env.COMMANDABLE_MCP_SQLITE_PATH
  if (forced && forced.trim().length)
    return resolve(forced.trim())
  return resolve(getCommandableDir(), 'credentials.sqlite')
}

function getSourceValue(): CommandableSource {
  const raw = (getFlagValue('--source') || 'package').trim().toLowerCase()
  if (raw === 'local' || raw === 'package')
    return raw
  console.error(`Invalid --source value: ${raw}. Use ${picocolors.cyan('package')} or ${picocolors.cyan('local')}.`)
  process.exit(1)
}

function getTransportValue(): CommandableTransport {
  const raw = (getFlagValue('--transport') || 'stdio').trim().toLowerCase()
  if (raw === 'stdio' || raw === 'http')
    return raw
  console.error(`Invalid --transport value: ${raw}. Use ${picocolors.cyan('stdio')} or ${picocolors.cyan('http')}.`)
  process.exit(1)
}

function getReadClientValue(): ReadClient {
  const raw = (getFlagValue('--client') || 'claude-desktop').trim().toLowerCase()
  if (raw === 'claude-desktop' || raw === 'cursor')
    return raw
  console.error(`Invalid --client value: ${raw}. Use ${picocolors.cyan('claude-desktop')} or ${picocolors.cyan('cursor')}.`)
  process.exit(1)
}

function stopDaemonProcess(): { stopped: boolean, pid: number | null } {
  const pid = readDaemonPid()
  if (pid?.pid) {
    try { process.kill(pid.pid, 'SIGTERM') } catch {}
  }
  try { unlinkSync(daemonPidPath()) } catch {}
  return { stopped: !!pid?.pid, pid: pid?.pid ?? null }
}

export function makeClaudeCodeAddCommand(source: CommandableSource): string {
  const envArgs = getClaudeCodeEnvEntries()
    .map(value => `-e ${quoteShellArg(value)}`)
    .join(' ')
  if (source === 'package')
    return `claude mcp add commandable${envArgs ? ` ${envArgs}` : ''} -- npx -y @commandable/mcp create-mode`
  const localBin = process.argv[1] && process.argv[1].trim().length
    ? resolve(process.argv[1])
    : '/absolute/path/to/commandable-mcp/packages/server/dist/cli/bin.js'
  return `claude mcp add commandable${envArgs ? ` ${envArgs}` : ''} -- node ${localBin} create-mode`
}

function execClaudeMcpAdd(args: string[]): void {
  const result = spawnSync('claude', args, { stdio: 'inherit' })
  if (result.error) {
    // claude CLI not available — print the command as fallback
    console.error(`claude ${args.join(' ')}`)
    return
  }
  if (result.status !== 0)
    process.exit(result.status ?? 1)
}

const CLAUDE_CODE_STDIO_ENV_KEYS = [
  'COMMANDABLE_SPACE_ID',
  'COMMANDABLE_DATA_DIR',
  'COMMANDABLE_MCP_SQLITE_PATH',
  'COMMANDABLE_UI_PORT',
  'DATABASE_URL',
  'COMMANDABLE_CONFIG_FILE',
  'COMMANDABLE_INTEGRATION_DATA_DIR',
] as const

function getClaudeCodeEnvEntries(): string[] {
  return CLAUDE_CODE_STDIO_ENV_KEYS
    .map((key) => {
      const value = process.env[key]
      return value && value.trim().length ? `${key}=${value}` : null
    })
    .filter((value): value is string => !!value)
}

function quoteShellArg(value: string): string {
  if (/^[A-Za-z0-9_./:=@-]+$/.test(value))
    return value
  return `'${value.replace(/'/g, `'\"'\"'`)}'`
}

export function makeReadModeConfig(source: CommandableSource): { mcpServers: Record<string, { command: string, args: string[] }> } {
  if (source === 'package') {
    return {
      mcpServers: {
        commandable: {
          command: 'npx',
          args: ['-y', '@commandable/mcp'],
        },
      },
    }
  }

  const localBin = process.argv[1] && process.argv[1].trim().length
    ? resolve(process.argv[1])
    : '/absolute/path/to/commandable-mcp/packages/server/dist/cli/bin.js'
  return {
    mcpServers: {
      commandable: {
        command: 'node',
        args: [localBin],
      },
    },
  }
}

export function makeHttpConnectionDetails(): { url: string, headers: { Authorization: string } } {
  const url = getFlagValue('--url') || 'https://your-host/mcp'
  const apiKey = getFlagValue('--api-key') || '<api-key>'
  return {
    url,
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  }
}

function makeClaudeCodeHttpAddCommand(): string {
  const details = makeHttpConnectionDetails()
  return `claude mcp add --transport http commandable ${details.url} --header "Authorization: ${details.headers.Authorization}"`
}

function printCreateInstructions(addCommand: string, instanceLabel: string) {
  const line = picocolors.dim('─'.repeat(60))
  console.error('')
  console.error(picocolors.white('The current create experience requires an advanced MCP client. We recommend Claude Code.'))
  console.error('')
  console.error(picocolors.bold(`Connect Claude Code to your local ${instanceLabel}:`))
  console.error(line)
  console.error(picocolors.cyan('claude mcp remove commandable'))
  console.error(picocolors.cyan(addCommand))
  console.error(line)
  console.error(picocolors.dim('Paste the commands above into your terminal, then restart Claude Code.'))
  console.error(picocolors.dim('Previous Commandable instances keep their own state and can be re-added later.'))
  console.error('')
}

function runCreate() {
  const source = getSourceValue()
  const transport = getTransportValue()
  const shouldApply = hasFlag('--apply')

  const command = transport === 'http'
    ? makeClaudeCodeHttpAddCommand()
    : makeClaudeCodeAddCommand(source)

  if (!shouldApply) {
    const instanceLabel = source === 'local' ? 'dev instance' : 'instance'
    printCreateInstructions(command, instanceLabel)
    return
  }

  if (transport === 'http') {
    const url = getFlagValue('--url')
    const apiKey = getFlagValue('--api-key')
    if (!url || !apiKey) {
      console.error(`For ${picocolors.cyan('--apply')} with HTTP, pass ${picocolors.cyan('--url')} and ${picocolors.cyan('--api-key')}.`)
      process.exit(1)
    }
    execClaudeMcpAdd(['mcp', 'add', '--transport', 'http', 'commandable', url, '--header', `Authorization: Bearer ${apiKey}`])
    console.error(`${picocolors.green('Done.')} Restart Claude Code.`)
    return
  }

  const envArgs = getClaudeCodeEnvEntries().flatMap(value => ['-e', value])

  if (source === 'package')
    execClaudeMcpAdd(['mcp', 'add', 'commandable', ...envArgs, '--', 'npx', '-y', '@commandable/mcp', 'create-mode'])
  else {
    const localBin = process.argv[1] && process.argv[1].trim().length
      ? resolve(process.argv[1])
      : '/absolute/path/to/commandable-mcp/packages/server/dist/cli/bin.js'
    execClaudeMcpAdd(['mcp', 'add', 'commandable', ...envArgs, '--', 'node', localBin, 'create-mode'])
  }
  console.error(`${picocolors.green('Done.')} Restart Claude Code.`)
}

async function runServeLocal(opts: { restart: boolean }) {
  const uiPort = getUiPort()
  const baseUrl = `http://127.0.0.1:${uiPort}`
  if (opts.restart)
    stopDaemonProcess()

  // Run migrations once here before the app server starts. Both the app server
  // and create-mode open the DB without running migrations themselves, so this
  // is the single authoritative place schema is applied.
  const migrateClient = createDbFromEnv()
  await ensureSchema(migrateClient)
  migrateClient.close()

  const ui = await startBundledManagementUi({ port: uiPort })
  if (!ui)
    throw new Error(`Failed to ${opts.restart ? 'restart' : 'start'} local Commandable instance`)

  const sqlitePath = getSqlitePathForLocalState()
  console.error(picocolors.green(`Commandable local instance ${ui.reused && !opts.restart ? 'ready' : 'running'}.`))
  console.error(`${picocolors.dim('Base URL:')} ${baseUrl}`)
  console.error(`${picocolors.dim('Management UI:')} ${baseUrl}/`)
  console.error(`${picocolors.dim('MCP endpoint:')} ${baseUrl}/mcp`)
  console.error(`${picocolors.dim('Data dir:')} ${getCommandableDir()}`)
  console.error(`${picocolors.dim('SQLite:')} ${sqlitePath}`)
  console.error(`${picocolors.dim('State:')} ${ui.reused ? 'reused existing instance' : 'started fresh instance'}`)
  console.error(`Next: ${picocolors.cyan('commandable-mcp create')} or ${picocolors.cyan('commandable-mcp connect --client claude-desktop')}`)
}

async function runServe() {
  const transport = getFlagValue('--transport')
  if (transport && transport.trim().toLowerCase() === 'http') {
    console.error('HTTP deployment is served by the app runtime, not this CLI.')
    console.error(`Use ${picocolors.cyan('yarn dev')} locally or deploy the app, then run ${picocolors.cyan('commandable-mcp create --transport http --url <url> --api-key <key>')}.`)
    return
  }
  return await runServeLocal({ restart: hasFlag('--restart') })
}

function runConnect() {
  const source = getSourceValue()
  const transport = getTransportValue()
  const client = getReadClientValue()

  if (transport === 'http') {
    console.error(JSON.stringify(makeHttpConnectionDetails(), null, 2))
    return
  }

  if (client === 'cursor' || client === 'claude-desktop') {
    console.error(JSON.stringify(makeReadModeConfig(source), null, 2))
  }
}

async function runDoctor() {
  const uiPort = getUiPort()
  const baseUrl = `http://127.0.0.1:${uiPort}`
  const pid = readDaemonPid()
  const pidAlive = pid ? isProcessAlive(pid.pid) : false
  const probe = await fetchJsonWithTimeout(`${baseUrl}/api/_commandable/status`, 500).catch(() => null)
  const probeVersion = typeof probe?.json?.version === 'string' && probe.json.version.trim().length
    ? probe.json.version.trim()
    : null
  const runningVersion = probeVersion || pid?.version || null
  const databaseUrl = process.env.DATABASE_URL
  const sqlitePath = databaseUrl && databaseUrl.trim().length ? null : getSqlitePathForLocalState()

  const report = {
    ok: true,
    installedVersion: COMMANDABLE_VERSION,
    mode: resolveMode(),
    env: {
      COMMANDABLE_SPACE_ID: (process.env.COMMANDABLE_SPACE_ID || 'local').trim() || 'local',
      COMMANDABLE_DATA_DIR: process.env.COMMANDABLE_DATA_DIR || null,
      COMMANDABLE_MCP_SQLITE_PATH: process.env.COMMANDABLE_MCP_SQLITE_PATH || null,
      COMMANDABLE_UI_PORT: uiPort,
      DATABASE_URL: databaseUrl && databaseUrl.trim().length ? '[set]' : null,
    },
    localState: {
      dataDir: getCommandableDir(),
      sqlitePath,
      daemonPidPath: daemonPidPath(),
      encryptionKeyPath: resolve(getCommandableDir(), 'encryption.key'),
    },
    daemon: {
      running: !!(pidAlive && probe?.ok),
      pid: pid ?? null,
      baseUrl,
      runningVersion,
      versionMatch: !!runningVersion && runningVersion === COMMANDABLE_VERSION,
      status: probe?.json ?? null,
    },
    hints: [
      'Use "commandable-mcp destroy local --yes" for a full local wipe.',
      'Use "commandable-mcp serve" to start the local Commandable instance.',
      'Use "commandable-mcp create" for the Claude Code authoring flow.',
      'Use "commandable-mcp connect --client claude-desktop" for a read-client config snippet.',
    ],
  }

  console.error(JSON.stringify(report, null, 2))
}

async function confirmDestroyLocal(params: { keepKey: boolean }): Promise<boolean> {
  note(
    [
      picocolors.bold(picocolors.red('This will delete all of your local saved Commandable data.')),
      '',
      `${picocolors.white('•')} saved integrations and credentials`,
      `${picocolors.white('•')} local SQLite state and daemon state`,
      `${picocolors.white('•')} ${params.keepKey ? 'the encryption key will be kept (--keep-key is set)' : 'the local encryption key'}`,
      '',
      picocolors.yellow('Remote Postgres data will not be deleted.'),
    ].join('\n'),
    picocolors.yellow('Warning'),
    { format: (str: string) => str },
  )

  const result = await select({
    message: 'Do you want to continue?',
    options: [
      { value: 'destroy', label: picocolors.red('Yes, destroy local data') },
      { value: 'cancel', label: picocolors.cyan('No, keep local data') },
    ],
    initialValue: 'cancel',
  })

  if (isCancel(result) || result !== 'destroy') {
    console.error(picocolors.yellow('Destroy cancelled.'))
    return false
  }

  return true
}

async function runDestroyLocal() {
  const keepKey = hasFlag('--keep-key')
  if (!hasFlag('--yes')) {
    const confirmed = await confirmDestroyLocal({ keepKey })
    if (!confirmed)
      return
  }

  const dataDir = getCommandableDir()
  const sqlitePath = getSqlitePathForLocalState()
  const keyPath = resolve(dataDir, 'encryption.key')
  const daemonPath = daemonPidPath()
  const stopped = stopDaemonProcess()

  const removed: string[] = []
  const missing: string[] = []
  for (const file of [sqlitePath, daemonPath, ...(keepKey ? [] : [keyPath])]) {
    if (!existsSync(file)) {
      missing.push(file)
      continue
    }
    try {
      unlinkSync(file)
      removed.push(file)
    }
    catch (err: any) {
      console.error(`Failed to remove ${file}: ${err?.message || err}`)
      process.exit(1)
    }
  }

  console.error(picocolors.green('Local destroy complete.'))
  console.error(`${picocolors.dim('Data dir:')} ${dataDir}`)
  console.error(`${picocolors.dim('Daemon stopped:')} ${stopped.stopped ? 'yes' : 'no (no PID found)'}`)
  if (removed.length)
    console.error(`${picocolors.dim('Removed:')} ${removed.join(', ')}`)
  if (missing.length)
    console.error(`${picocolors.dim('Already absent:')} ${missing.join(', ')}`)
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length)
    console.error(`${picocolors.yellow('Warning:')} DATABASE_URL is set; remote Postgres data was not modified.`)
  console.error(`Next step: ${picocolors.cyan('commandable-mcp serve')}`)
  console.error(`Then connect create mode: ${picocolors.cyan('commandable-mcp create')}`)
  console.error(`Legacy bootstrap: ${picocolors.cyan('commandable-mcp static-init')}`)
}

async function runRefreshLocalDev() {
  await runServeLocal({ restart: true })
}

function help(exitCode: number = 0): never {
  const lines = [
    '',
    `${picocolors.bold('Commandable MCP')} — build and serve app-connected MCP tools`,
    picocolors.dim(`v${COMMANDABLE_VERSION}`),
    '',
    picocolors.bold('Usage'),
    `  ${picocolors.cyan('commandable-mcp serve')} ${picocolors.dim('[--restart]')}`,
    `  ${picocolors.cyan('commandable-mcp create')} ${picocolors.dim('[--transport stdio|http] [--source package|local] [--apply] [--url] [--api-key]')}`,
    `  ${picocolors.cyan('commandable-mcp connect')} ${picocolors.dim('[--client claude-desktop|cursor] [--transport stdio|http] [--source package|local] [--url] [--api-key]')}`,
    `  ${picocolors.cyan('commandable-mcp doctor')}`,
    `  ${picocolors.cyan('commandable-mcp destroy local')} ${picocolors.dim('[--yes] [--keep-key]')}`,
    `  ${picocolors.cyan('commandable-mcp apply')} ${picocolors.dim('[--config ./commandable.config.yaml]')}`,
    `  ${picocolors.cyan('commandable-mcp create-api-key')} ${picocolors.dim('[name]')}`,
    `  ${picocolors.cyan('commandable-mcp --version')}`,
    '',
    picocolors.bold('Notes'),
    `- Credentials entered via the CLI are stored encrypted at ${picocolors.dim('~/.commandable/')} (override with ${picocolors.cyan('COMMANDABLE_DATA_DIR')}).`,
    `- ${picocolors.bold('Serve')}: starts or reuses the local Commandable instance.`,
    `- ${picocolors.bold('Create')}: Claude Code authoring flow. Prints or applies the ${picocolors.cyan('claude mcp add')} command.`,
    `- ${picocolors.bold('Connect')}: prints read-client connection details for the MCP server you already configured.`,
    '',
  ]
  console.error(lines.join('\n'))
  process.exit(exitCode)
}

async function runStdioFromDb(forceMode?: 'static' | 'create') {
  const spaceId = process.env.COMMANDABLE_SPACE_ID || 'local'
  const { db, credentialStore } = await openLocalState()
  const integrations = await listIntegrations(db, spaceId)
  const toolDefinitions = await listToolDefinitions(db, spaceId)
  const integrationTypeConfigs = await listIntegrationTypeConfigs(db, spaceId)

  const integrationTypeConfigsRef = { current: integrationTypeConfigs }

  const proxy = new IntegrationProxy({
    credentialStore,
    trelloApiKey: process.env.TRELLO_API_KEY,
    integrationTypeConfigsRef,
  })

  const mode = forceMode ?? resolveMode()
  if (!integrations.length && mode !== 'create') {
    console.error(`No integrations configured yet.`)
    console.error(`Preferred: ${picocolors.cyan('commandable-mcp create')} then configure tools in Claude Code.`)
    console.error(`Legacy read-mode bootstrap: ${picocolors.cyan('commandable-mcp static-init')}.`)
    process.exit(0)
  }

  const integrationsRef = { current: integrations }
  const index = buildMcpToolIndex({ spaceId, integrations, proxy, integrationsRef, toolDefinitions })

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
                integrationTypeConfigsRef,
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

  if (cmd === 'serve')
    return await runServe()

  if (cmd === 'create')
    return runCreate()

  if (cmd === 'connect')
    return runConnect()

  if (cmd === 'static-init') {
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

  if (cmd === 'doctor')
    return await runDoctor()

  if (cmd === 'destroy') {
    const sub = (process.argv[3] || '').trim().toLowerCase()
    if (sub === 'local')
      return await runDestroyLocal()
    help(1)
  }

  if (cmd === 'setup') {
    const sub = (process.argv[3] || '').trim().toLowerCase()
    if (sub === 'claude-code')
      return runCreate()
    help(1)
  }

  if (cmd === 'refresh') {
    const sub = (process.argv[3] || '').trim().toLowerCase()
    if (sub === 'local-dev')
      return await runRefreshLocalDev()
    help(1)
  }

  if (cmd === 'create-api-key')
    return await runCreateApiKey()

  if (cmd === 'create-mode')
    return await runStdioFromDb('create')

  if (cmd === 'daemon') {
    const sub = (process.argv[3] || '').trim().toLowerCase()
    const uiPort = getUiPort()
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
      const stopped = stopDaemonProcess()
      console.error(stopped.stopped
        ? `Stopped daemon${stopped.pid ? ` (pid ${stopped.pid})` : ''}.`
        : 'No daemon PID found; nothing to stop.')
      return
    }

    if (sub === 'start') {
      await runServeLocal({ restart: false })
      return
    }

    if (sub === 'restart') {
      await runServeLocal({ restart: true })
      return
    }

    help(1)
  }

  if (cmd && !cmd.startsWith('-'))
    help(1)

  return await runStdioFromDb()
}

