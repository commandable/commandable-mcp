import { runLocalStdioSession } from '@commandable/mcp-core'
import { COMMANDABLE_CONNECT_VERSION } from '../version.js'

function hasFlag(...flags: string[]): boolean {
  return flags.some(flag => process.argv.includes(flag))
}

function getUiPort(): number {
  const raw = process.env.COMMANDABLE_UI_PORT
  return raw && /^\d+$/.test(raw) ? Number(raw) : 23432
}

async function fetchJsonWithTimeout(url: string, timeoutMs: number): Promise<any> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { signal: controller.signal })
    const text = await response.text()
    let json: any = null
    try {
      json = text ? JSON.parse(text) : null
    }
    catch {}
    return { ok: response.ok, status: response.status, json }
  }
  finally {
    clearTimeout(timeout)
  }
}

async function assertLocalServerRunning(mode: 'static' | 'create'): Promise<void> {
  const baseUrl = `http://127.0.0.1:${getUiPort()}`
  const probe = await fetchJsonWithTimeout(`${baseUrl}/api/_commandable/status`, 500).catch(() => null)
  if (probe?.ok)
    return

  if (mode === 'create') {
    console.error('Commandable create mode requires the local server to already be running.')
    console.error('Start it first with: npx -y @commandable/mcp serve')
  }
  else {
    console.error('Commandable read mode requires the local server to already be running.')
    console.error('Start it first with: npx -y @commandable/mcp serve')
    console.error('Then configure integrations with: npx -y @commandable/mcp create')
  }
  process.exit(1)
}

function help(exitCode = 0): never {
  console.error([
    '',
    'Commandable MCP connector',
    `v${COMMANDABLE_CONNECT_VERSION}`,
    '',
    'Usage',
    '  commandable-mcp-connect create-mode',
    '  commandable-mcp-connect read-mode',
    '  commandable-mcp-connect',
    '  commandable-mcp-connect --help',
    '  commandable-mcp-connect --version',
    '',
    'Notes',
    '  - The local Commandable server must already be running.',
    '  - Start it with: npx -y @commandable/mcp serve',
    '',
  ].join('\n'))
  process.exit(exitCode)
}

export async function main(): Promise<void> {
  const cmd = process.argv[2]

  if (hasFlag('--version', '-v')) {
    console.error(COMMANDABLE_CONNECT_VERSION)
    process.exit(0)
  }

  if (hasFlag('--help', '-h'))
    help(0)

  if (cmd === 'create-mode') {
    await assertLocalServerRunning('create')
    await runLocalStdioSession({
      mode: 'create',
      serverInfo: { name: 'commandable', version: COMMANDABLE_CONNECT_VERSION },
    })
    return
  }

  if (!cmd || cmd === 'read-mode') {
    await assertLocalServerRunning('static')
    await runLocalStdioSession({
      mode: 'static',
      serverInfo: { name: 'commandable', version: COMMANDABLE_CONNECT_VERSION },
    })
    return
  }

  help(1)
}
