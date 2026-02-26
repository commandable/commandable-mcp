import { existsSync } from 'node:fs'
import { dirname, isAbsolute, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import picocolors from 'picocolors'
import type { IntegrationData } from '../types.js'
import { IntegrationProxy, type CredentialStore } from '../integrations/proxy.js'
import { buildMcpToolIndex } from '../mcp/toolAdapter.js'
import { runStdioMcpServer } from '../mcp/server.js'
import { loadCommandableConfig, type CommandableConfig } from '../config/loader.js'
import { runAddInteractive, runInitInteractive } from './setup.js'
import { openCredentialStore } from './credentialManager.js'
import { loadIntegrationCredentialConfig } from '../integrations/dataLoader.js'

class InMemoryCredentialStore implements CredentialStore {
  private readonly map = new Map<string, Record<string, string>>()

  set(spaceId: string, credentialId: string, creds: Record<string, string>) {
    this.map.set(`${spaceId}:${credentialId}`, creds)
  }

  async getCredentials(spaceId: string, credentialId: string) {
    return this.map.get(`${spaceId}:${credentialId}`) ?? null
  }
}

class CompositeCredentialStore implements CredentialStore {
  constructor(
    private readonly primary: CredentialStore,
    private readonly fallback: CredentialStore,
  ) {}

  async getCredentials(spaceId: string, credentialId: string) {
    return await this.primary.getCredentials(spaceId, credentialId)
      ?? await this.fallback.getCredentials(spaceId, credentialId)
  }
}

function parseArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag)
  if (idx === -1) return undefined
  return process.argv[idx + 1]
}

function hasFlag(...flags: string[]): boolean {
  return flags.some(f => process.argv.includes(f))
}

function help(exitCode: number = 0): never {
  const lines = [
    '',
    `${picocolors.bold('Commandable MCP')} — connect your apps to MCP clients`,
    '',
    picocolors.bold('Usage'),
    `  ${picocolors.cyan('commandable-mcp init')} ${picocolors.dim('[--output ./commandable.json]')}`,
    `  ${picocolors.cyan('commandable-mcp add')}  ${picocolors.dim('[--config ./commandable.json]')}`,
    `  ${picocolors.cyan('commandable-mcp')}      ${picocolors.dim('[--config ./commandable.json]')}`,
    '',
    picocolors.bold('Notes'),
    `- Your MCP client should run this via: ${picocolors.cyan('npx @commandable/mcp --config /absolute/path/to/commandable.json')}`,
    `- If ${picocolors.dim('./commandable.json')} exists, running ${picocolors.cyan('commandable-mcp')} will start the server using it.`,
    `- Credentials entered via the CLI are stored encrypted at ${picocolors.dim('~/.commandable/')} (override with ${picocolors.cyan('COMMANDABLE_DATA_DIR')}).`,
    '',
  ]
  console.error(lines.join('\n'))
  process.exit(exitCode)
}

function resolveConfigPath(path: string): string {
  let abs = resolve(process.cwd(), path)
  if (!existsSync(abs) && abs.endsWith('~')) {
    const without = abs.slice(0, -1)
    if (existsSync(without))
      abs = without
  }
  return abs
}

function getConfigIntegrations(cfg: CommandableConfig, spaceId: string, credStore: InMemoryCredentialStore): IntegrationData[] {
  return cfg.integrations.map((i) => {
    const id = randomUUID()
    const referenceId = i.referenceId || i.type
    const label = i.label || i.type
    const integ: IntegrationData = {
      spaceId,
      id,
      referenceId,
      type: i.type,
      label,
      config: i.config,
    }

    const supportsCredentials = !!loadIntegrationCredentialConfig(i.type)
    if (supportsCredentials) {
      const credentialId = `${referenceId}-creds`
      integ.connectionMethod = 'credentials'
      integ.credentialId = credentialId

      if (i.credentials) {
        console.error(
          picocolors.yellow(
            `Warning: Found credentials inline in config for '${i.type}'. ` +
            `It's safer to store credentials in the encrypted local store (run 'commandable-mcp init').`,
          ),
        )
        credStore.set(spaceId, credentialId, i.credentials)
      }
    }

    return integ
  })
}

async function runStdioFromConfig() {
  const configPath = parseArg('--config') || './commandable.json'
  const absConfigPath = resolveConfigPath(configPath)

  const cfg = loadCommandableConfig(absConfigPath)

  const spaceId = cfg.spaceId || 'local'

  if (cfg.integrationDataDir) {
    const baseDir = dirname(absConfigPath)
    process.env.COMMANDABLE_INTEGRATION_DATA_DIR = isAbsolute(cfg.integrationDataDir)
      ? cfg.integrationDataDir
      : resolve(baseDir, cfg.integrationDataDir)
  }

  const memStore = new InMemoryCredentialStore()
  const integrations: IntegrationData[] = getConfigIntegrations(cfg, spaceId, memStore)

  const { store: sqlStore } = await openCredentialStore()
  const credentialStore: CredentialStore = new CompositeCredentialStore(memStore, sqlStore)

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

  if (cmd === 'init') {
    const outPath = parseArg('--output') || './commandable.json'
    return await runInitInteractive(outPath)
  }

  if (cmd === 'add') {
    const configPath = parseArg('--config') || './commandable.json'
    return await runAddInteractive(configPath)
  }

  if (cmd && !cmd.startsWith('-'))
    help(1)

  if (!cmd) {
    if (!existsSync(resolve(process.cwd(), './commandable.json')))
      help(0)
  }

  return await runStdioFromConfig()
}

