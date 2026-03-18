import crypto from 'node:crypto'
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, openSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { isCancel, note, select } from '@clack/prompts'
import picocolors from 'picocolors'
import {
  SqlCredentialStore,
  applyConfig,
  createApiKey,
  createDbFromEnv,
  ensureSchema,
  generateApiKey,
  getCommandableDir,
  getOrCreateEncryptionSecret,
  loadConfig
} from '@commandable/mcp-core'

const require = createRequire(import.meta.url)
const pkg = require('../package.json')

const COMMANDABLE_VERSION = String(pkg.version || '0.0.0')
const packageRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const serverEntry = resolve(packageRoot, '.output', 'server', 'index.mjs')
const CLAUDE_CODE_STDIO_ENV_KEYS = [
  'COMMANDABLE_SPACE_ID',
  'COMMANDABLE_DATA_DIR',
  'COMMANDABLE_MCP_SQLITE_PATH',
  'COMMANDABLE_UI_PORT',
  'DATABASE_URL',
  'COMMANDABLE_CONFIG_FILE',
  'COMMANDABLE_INTEGRATION_DATA_DIR'
]

function hasFlag(...flags) {
  return flags.some(flag => process.argv.includes(flag))
}

function getFlagValue(flag) {
  const index = process.argv.indexOf(flag)
  if (index === -1)
    return null
  const value = process.argv[index + 1]
  if (!value || value.startsWith('-'))
    return null
  return value
}

function getUiPort() {
  const raw = process.env.COMMANDABLE_UI_PORT
  return raw && /^\d+$/.test(raw) ? Number(raw) : 23432
}

function getBaseUrl() {
  return `http://127.0.0.1:${getUiPort()}`
}

function daemonPidPath() {
  return resolve(getCommandableDir(), 'daemon.pid')
}

function daemonLogPath() {
  return resolve(getCommandableDir(), 'daemon.log')
}

function getSqlitePathForLocalState() {
  const forced = process.env.COMMANDABLE_MCP_SQLITE_PATH
  if (forced && forced.trim().length)
    return resolve(forced.trim())
  return resolve(getCommandableDir(), 'credentials.sqlite')
}

function readDaemonPid() {
  try {
    const raw = readFileSync(daemonPidPath(), 'utf8')
    const lines = raw.split('\n').map(line => line.trim()).filter(Boolean)
    const pid = lines[0] && /^\d+$/.test(lines[0]) ? Number(lines[0]) : null
    const version = lines[1] || null
    return pid ? { pid, version } : null
  } catch {
    return null
  }
}

function isProcessAlive(pid) {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

function stopDaemonProcess() {
  const info = readDaemonPid()
  if (info?.pid) {
    try {
      process.kill(info.pid, 'SIGTERM')
    } catch {}
  }
  try {
    unlinkSync(daemonPidPath())
  } catch {}
  return { stopped: !!info?.pid, pid: info?.pid ?? null }
}

async function fetchJsonWithTimeout(url, timeoutMs) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { signal: controller.signal })
    const text = await response.text()
    let json = null
    try {
      json = text ? JSON.parse(text) : null
    } catch {}
    return { ok: response.ok, status: response.status, json }
  } finally {
    clearTimeout(timeout)
  }
}

async function waitForHttp(url, timeoutMs) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    const probe = await fetchJsonWithTimeout(url, 400).catch(() => null)
    if (probe?.ok)
      return probe
    await new Promise(resolvePromise => setTimeout(resolvePromise, 250))
  }
  return null
}

async function assertLocalServerRunning() {
  const baseUrl = getBaseUrl()
  const probe = await fetchJsonWithTimeout(`${baseUrl}/api/_commandable/status`, 500).catch(() => null)
  if (probe?.ok)
    return probe.json

  console.error('Commandable local mode requires the server to already be running.')
  console.error('Start it first with: npx -y @commandable/mcp serve')
  process.exit(1)
}

function makeClaudeCodeAddCommand() {
  const envArgs = getClaudeCodeEnvEntries()
    .map(value => `-e ${quoteShellArg(value)}`)
    .join(' ')
  return `claude mcp add commandable${envArgs ? ` ${envArgs}` : ''} -- npx -y @commandable/mcp-connect create-mode`
}

function getClaudeCodeEnvEntries() {
  return CLAUDE_CODE_STDIO_ENV_KEYS
    .map((key) => {
      const value = process.env[key]
      return value && value.trim().length ? `${key}=${value}` : null
    })
    .filter(Boolean)
}

function quoteShellArg(value) {
  if (/^[A-Za-z0-9_./:=@-]+$/.test(value))
    return value
  return `'${value.replace(/'/g, `'\"'\"'`)}'`
}

function makeReadModeConfig() {
  return {
    mcpServers: {
      commandable: {
        command: 'npx',
        args: ['-y', '@commandable/mcp-connect', 'static-mode']
      }
    }
  }
}

function makeHttpConnectionDetails() {
  const url = getFlagValue('--url') || 'https://your-host/mcp'
  const apiKey = getFlagValue('--api-key') || '<api-key>'
  return {
    url,
    headers: {
      Authorization: `Bearer ${apiKey}`
    }
  }
}

function makeClaudeCodeHttpAddCommand() {
  const details = makeHttpConnectionDetails()
  return `claude mcp add --transport http commandable ${details.url} --header "Authorization: ${details.headers.Authorization}"`
}

function printCreateInstructions(addCommand, instanceLabel) {
  const line = picocolors.dim('─'.repeat(60))
  console.error('')
  console.error(picocolors.white('The current create experience requires an advanced MCP client. We recommend Claude Code.'))
  console.error('')
  console.error(picocolors.bold(`Connect Claude Code to your ${instanceLabel}:`))
  console.error(line)
  console.error(picocolors.cyan('claude mcp remove commandable'))
  console.error(picocolors.cyan(addCommand))
  console.error(line)
  console.error(picocolors.dim('Paste the commands above into your terminal, then restart Claude Code.'))
  console.error(picocolors.dim('Previous Commandable instances keep their own state and can be re-added later.'))
  console.error('')
}

function execClaudeMcpAdd(args) {
  const result = spawnSync('claude', args, { stdio: 'inherit' })
  if (result.error) {
    console.error(`claude ${args.join(' ')}`)
    return
  }
  if (result.status !== 0)
    process.exit(result.status ?? 1)
}

async function startManagementUi({ restart }) {
  const baseUrl = getBaseUrl()
  const existingPid = readDaemonPid()
  if (!restart && existingPid?.pid && isProcessAlive(existingPid.pid)) {
    const probe = await fetchJsonWithTimeout(`${baseUrl}/api/_commandable/status`, 500).catch(() => null)
    if (probe?.ok)
      return { reused: true, baseUrl }
  }

  if (restart)
    stopDaemonProcess()

  if (!existsSync(serverEntry)) {
    console.error(`Missing built app server at ${serverEntry}`)
    console.error('Run a package build first.')
    process.exit(1)
  }

  mkdirSync(getCommandableDir(), { recursive: true })
  const logPath = daemonLogPath()
  const fd = openSync(logPath, 'a')
  const child = spawn(process.execPath, [serverEntry], {
    cwd: packageRoot,
    env: {
      ...process.env,
      HOST: '127.0.0.1',
      PORT: String(getUiPort()),
      COMMANDABLE_UI_PORT: String(getUiPort()),
      COMMANDABLE_VERSION
    },
    detached: true,
    stdio: ['ignore', fd, fd]
  })
  child.unref()

  writeFileSync(daemonPidPath(), `${child.pid}\n${COMMANDABLE_VERSION}\n`)

  const probe = await waitForHttp(`${baseUrl}/api/_commandable/status`, 12000)
  if (!probe?.ok) {
    try {
      process.kill(child.pid, 'SIGTERM')
    } catch {}
    try {
      unlinkSync(daemonPidPath())
    } catch {}
    console.error(`Commandable management UI failed to start at ${baseUrl}`)
    console.error(`Check the daemon log at ${logPath}`)
    process.exit(1)
  }

  return { reused: false, baseUrl }
}

async function openEnvState() {
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
    }
  }
}

async function runServe() {
  const migrateClient = createDbFromEnv()
  await ensureSchema(migrateClient)
  if (migrateClient.dialect === 'sqlite')
    migrateClient.close()
  else
    await migrateClient.close()

  const ui = await startManagementUi({ restart: hasFlag('--restart') })
  const baseUrl = ui.baseUrl
  console.error(picocolors.green(`Commandable local instance ${ui.reused ? 'ready' : 'running'}.`))
  console.error(`${picocolors.dim('Base URL:')} ${baseUrl}`)
  console.error(`${picocolors.dim('Management UI:')} ${baseUrl}/`)
  console.error(`${picocolors.dim('Dynamic MCP endpoint:')} ${baseUrl}/mcp`)
  console.error(`${picocolors.dim('Static MCP endpoint:')} ${baseUrl}/mcp/static`)
  console.error(`${picocolors.dim('Create endpoint:')} ${baseUrl}/mcp/create`)
  console.error(`${picocolors.dim('Data dir:')} ${getCommandableDir()}`)
  console.error(`${picocolors.dim('SQLite:')} ${getSqlitePathForLocalState()}`)
  console.error(`Next: ${picocolors.cyan('npx -y @commandable/mcp create')}`)
}

function runCreate() {
  const transport = (getFlagValue('--transport') || 'stdio').trim().toLowerCase()
  const shouldApply = hasFlag('--apply')

  if (transport === 'http') {
    const command = makeClaudeCodeHttpAddCommand()
    if (!shouldApply) {
      printCreateInstructions(command, 'HTTP deployment')
      return
    }
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

  return assertLocalServerRunning().then(() => {
    const command = makeClaudeCodeAddCommand()
    if (!shouldApply) {
      printCreateInstructions(command, 'local instance')
      return
    }
    const envArgs = getClaudeCodeEnvEntries().flatMap(value => ['-e', value])
    execClaudeMcpAdd(['mcp', 'add', 'commandable', ...envArgs, '--', 'npx', '-y', '@commandable/mcp-connect', 'create-mode'])
    console.error(`${picocolors.green('Done.')} Restart Claude Code.`)
  })
}

async function runConnect() {
  const transport = (getFlagValue('--transport') || 'stdio').trim().toLowerCase()
  const client = (getFlagValue('--client') || 'claude-desktop').trim().toLowerCase()
  if (client !== 'claude-desktop' && client !== 'cursor') {
    console.error('Invalid --client value. Use claude-desktop or cursor.')
    process.exit(1)
  }

  if (transport === 'http') {
    console.error(JSON.stringify(makeHttpConnectionDetails(), null, 2))
    return
  }

  await assertLocalServerRunning()
  console.error(JSON.stringify(makeReadModeConfig(), null, 2))
}

async function runDoctor() {
  const baseUrl = getBaseUrl()
  const pid = readDaemonPid()
  const pidAlive = pid ? isProcessAlive(pid.pid) : false
  const probe = await fetchJsonWithTimeout(`${baseUrl}/api/_commandable/status`, 500).catch(() => null)
  const runningVersion = typeof probe?.json?.version === 'string' && probe.json.version.trim().length
    ? probe.json.version.trim()
    : (pid?.version || null)
  const databaseUrl = process.env.DATABASE_URL
  const sqlitePath = databaseUrl && databaseUrl.trim().length ? null : getSqlitePathForLocalState()

  console.error(JSON.stringify({
    ok: true,
    installedVersion: COMMANDABLE_VERSION,
    env: {
      COMMANDABLE_SPACE_ID: (process.env.COMMANDABLE_SPACE_ID || 'local').trim() || 'local',
      COMMANDABLE_DATA_DIR: process.env.COMMANDABLE_DATA_DIR || null,
      COMMANDABLE_MCP_SQLITE_PATH: process.env.COMMANDABLE_MCP_SQLITE_PATH || null,
      COMMANDABLE_UI_PORT: getUiPort(),
      DATABASE_URL: databaseUrl && databaseUrl.trim().length ? '[set]' : null
    },
    localState: {
      dataDir: getCommandableDir(),
      sqlitePath,
      daemonPidPath: daemonPidPath(),
      daemonLogPath: daemonLogPath(),
      encryptionKeyPath: resolve(getCommandableDir(), 'encryption.key')
    },
    daemon: {
      running: !!(pidAlive && probe?.ok),
      pid: pid ?? null,
      baseUrl,
      runningVersion,
      versionMatch: !!runningVersion && runningVersion === COMMANDABLE_VERSION,
      status: probe?.json ?? null
    }
  }, null, 2))
}

async function runDestroyLocal() {
  const keepKey = hasFlag('--keep-key')
  if (!hasFlag('--yes')) {
    note(
      [
        picocolors.bold(picocolors.red('This will delete all of your local saved Commandable data.')),
        '',
        `${picocolors.white('•')} saved integrations and credentials`,
        `${picocolors.white('•')} local SQLite state and daemon state`,
        `${picocolors.white('•')} ${keepKey ? 'the encryption key will be kept (--keep-key is set)' : 'the local encryption key'}`,
        '',
        picocolors.yellow('Remote Postgres data will not be deleted.')
      ].join('\n'),
      picocolors.yellow('Warning'),
      { format: str => str }
    )
    const result = await select({
      message: 'Do you want to continue?',
      options: [
        { value: 'destroy', label: picocolors.red('Yes, destroy local data') },
        { value: 'cancel', label: picocolors.cyan('No, keep local data') }
      ],
      initialValue: 'cancel'
    })
    if (isCancel(result) || result !== 'destroy') {
      console.error(picocolors.yellow('Destroy cancelled.'))
      return
    }
  }

  const dataDir = getCommandableDir()
  const sqlitePath = getSqlitePathForLocalState()
  const keyPath = resolve(dataDir, 'encryption.key')
  const daemonPath = daemonPidPath()
  const logPath = daemonLogPath()
  const stopped = stopDaemonProcess()
  const removed = []
  const missing = []

  for (const file of [sqlitePath, daemonPath, logPath, ...(keepKey ? [] : [keyPath])]) {
    if (!existsSync(file)) {
      missing.push(file)
      continue
    }
    unlinkSync(file)
    removed.push(file)
  }

  console.error(picocolors.green('Local destroy complete.'))
  console.error(`${picocolors.dim('Data dir:')} ${dataDir}`)
  console.error(`${picocolors.dim('Daemon stopped:')} ${stopped.stopped ? 'yes' : 'no'}`)
  if (removed.length)
    console.error(`${picocolors.dim('Removed:')} ${removed.join(', ')}`)
  if (missing.length)
    console.error(`${picocolors.dim('Already absent:')} ${missing.join(', ')}`)
}

async function runApply() {
  const cfgPath = getFlagValue('--config') || process.env.COMMANDABLE_CONFIG_FILE || null
  const { config, path } = loadConfig(cfgPath || undefined)
  const spaceId = process.env.COMMANDABLE_SPACE_ID || config.spaceId || 'local'
  const { db, credentialStore, close } = await openEnvState()
  try {
    const result = await applyConfig({ config, db, credentialStore, defaultSpaceId: spaceId })
    console.error(`${picocolors.green('Config applied.')}`)
    console.error(`${picocolors.dim('File:')} ${path}`)
    console.error(`${picocolors.dim('Space:')} ${result.spaceId}`)
    console.error(`${picocolors.dim('Integrations upserted:')} ${result.integrationsUpserted}`)
    console.error(`${picocolors.dim('Credentials written:')} ${result.credentialsWritten}`)
    console.error(`${picocolors.dim('Credentials unchanged:')} ${result.credentialsUnchanged}`)
  } finally {
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
  } finally {
    await close()
  }
}

function help(exitCode = 0) {
  console.error([
    '',
    picocolors.bold('Commandable MCP'),
    picocolors.dim(`v${COMMANDABLE_VERSION}`),
    '',
    picocolors.bold('Usage'),
    `  ${picocolors.cyan('commandable-mcp serve')} ${picocolors.dim('[--restart]')}`,
    `  ${picocolors.cyan('commandable-mcp create')} ${picocolors.dim('[--transport stdio|http] [--apply] [--url] [--api-key]')}`,
    `  ${picocolors.cyan('commandable-mcp connect')} ${picocolors.dim('[--client claude-desktop|cursor] [--transport stdio|http] [--url] [--api-key]')}`,
    `  ${picocolors.cyan('commandable-mcp doctor')}`,
    `  ${picocolors.cyan('commandable-mcp destroy local')} ${picocolors.dim('[--yes] [--keep-key]')}`,
    `  ${picocolors.cyan('commandable-mcp apply')} ${picocolors.dim('[--config ./commandable.config.yaml]')}`,
    `  ${picocolors.cyan('commandable-mcp create-api-key')} ${picocolors.dim('[name]')}`,
    `  ${picocolors.cyan('commandable-mcp --version')}`,
    '',
    picocolors.bold('Notes'),
    `- ${picocolors.bold('Serve')}: starts or reuses the local Commandable instance.`,
    `- ${picocolors.bold('Create')}: Claude Code authoring flow. Prints or applies ${picocolors.cyan('claude mcp add')} for builder mode.`,
    `- ${picocolors.bold('Connect')}: prints compatibility client connection details (stdio static-mode or HTTP /mcp by default).`,
    ''
  ].join('\n'))
  process.exit(exitCode)
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
    return runServe()
  if (cmd === 'create')
    return runCreate()
  if (cmd === 'connect')
    return runConnect()
  if (cmd === 'doctor')
    return runDoctor()
  if (cmd === 'apply')
    return runApply()
  if (cmd === 'create-api-key')
    return runCreateApiKey()
  if (cmd === 'destroy' && (process.argv[3] || '').trim().toLowerCase() === 'local')
    return runDestroyLocal()

  help(cmd ? 1 : 0)
}
