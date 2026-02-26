import picocolors from 'picocolors'
import { IntegrationProxy } from '../integrations/proxy.js'
import { buildMcpToolIndex } from '../mcp/toolAdapter.js'
import { runStdioMcpServer } from '../mcp/server.js'
import { runAddInteractive, runInitInteractive } from './setup.js'
import { openLocalState } from './credentialManager.js'
import { listIntegrations } from '../db/integrationStore.js'

function hasFlag(...flags: string[]): boolean {
  return flags.some(f => process.argv.includes(f))
}

function help(exitCode: number = 0): never {
  const lines = [
    '',
    `${picocolors.bold('Commandable MCP')} — connect your apps to MCP clients`,
    '',
    picocolors.bold('Usage'),
    `  ${picocolors.cyan('commandable-mcp init')}`,
    `  ${picocolors.cyan('commandable-mcp add')}`,
    `  ${picocolors.cyan('commandable-mcp status')}`,
    `  ${picocolors.cyan('commandable-mcp')} ${picocolors.dim('(start MCP server)')}`,
    '',
    picocolors.bold('Notes'),
    `- Credentials entered via the CLI are stored encrypted at ${picocolors.dim('~/.commandable/')} (override with ${picocolors.cyan('COMMANDABLE_DATA_DIR')}).`,
    `- MCP clients (Claude Desktop, Cursor) spawn this server process automatically via: ${picocolors.cyan('npx @commandable/mcp')}`,
    '',
  ]
  console.error(lines.join('\n'))
  process.exit(exitCode)
}

async function runStdioFromDb() {
  const spaceId = 'local'
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

  const index = buildMcpToolIndex({ spaceId, integrations, proxy })

  await runStdioMcpServer({
    serverInfo: { name: 'commandable', version: '0.0.1' },
    tools: { list: index.tools, byName: index.byName },
  })
}

export async function main() {
  const cmd = process.argv[2]

  if (hasFlag('--help', '-h'))
    help(0)

  if (cmd === 'init')
    return await runInitInteractive()

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

  if (cmd && !cmd.startsWith('-'))
    help(1)

  return await runStdioFromDb()
}

