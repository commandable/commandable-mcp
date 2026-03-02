import crypto from 'node:crypto'
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { resolve } from 'node:path'
import { createDb, type DbClient } from '../db/client.js'
import { ensureSchema } from '../db/migrate.js'
import { SqlCredentialStore } from '../db/credentialStore.js'

function getDataDir(): string {
  const base = process.env.COMMANDABLE_DATA_DIR
  if (base && base.trim().length)
    return resolve(base)
  return resolve(homedir(), '.commandable')
}

export function getCommandableDir(): string {
  const dir = getDataDir()
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true, mode: 0o700 })
  }
  else {
    try { chmodSync(dir, 0o700) } catch {}
  }
  return dir
}

export function getOrCreateEncryptionSecret(): string {
  const envSecret = process.env.COMMANDABLE_ENCRYPTION_SECRET || process.env.COMMANDABLE_MCP_ENCRYPTION_SECRET
  if (envSecret && envSecret.trim().length)
    return envSecret.trim()

  const dir = getCommandableDir()
  const keyPath = resolve(dir, 'encryption.key')
  if (existsSync(keyPath)) {
    const existing = readFileSync(keyPath, 'utf8').trim()
    if (!existing)
      throw new Error(`Encryption key file exists but is empty: ${keyPath}`)
    return existing
  }

  const secret = crypto.randomBytes(32).toString('hex')
  writeFileSync(keyPath, `${secret}\n`, { mode: 0o600 })
  try { chmodSync(keyPath, 0o600) } catch {}
  return secret
}

const REQUIRED_INTEGRATION_COLUMNS = [
  'id', 'space_id', 'type', 'reference_id', 'label',
  'connection_method', 'connection_id', 'credential_id', 'credential_variant',
  'config_json', 'enabled_toolsets', 'max_scope', 'disabled_tools', 'created_at',
]

export async function openLocalDb(): Promise<{ db: DbClient, close: () => Promise<void> }> {
  const dir = getCommandableDir()
  const sqlitePath = resolve(dir, 'credentials.sqlite')
  const client = createDb({ sqlitePath })
  await ensureSchema(client)

  // Verify the integrations table has all expected columns. We're in early
  // development and don't run migrations — if the schema is stale the user
  // must delete the database and start fresh.
  if (client.dialect === 'sqlite') {
    const cols: Array<{ name: string }> = client.raw.prepare('PRAGMA table_info(integrations)').all() as any
    const colNames = new Set(cols.map(c => c.name))
    const missing = REQUIRED_INTEGRATION_COLUMNS.filter(c => !colNames.has(c))
    if (missing.length) {
      if (client.dialect === 'sqlite')
        client.close()
      console.error(`\nError: Your database is out of date (missing columns: ${missing.join(', ')}).`)
      console.error(`\nWe're in early development and don't run automatic migrations yet.`)
      console.error(`Please delete your database and run again:\n`)
      console.error(`  rm ${sqlitePath}`)
      console.error(`  commandable-mcp init\n`)
      process.exit(1)
    }
  }

  return {
    db: client,
    close: async () => {
      if (client.dialect === 'sqlite')
        client.close()
      else
        await client.close()
    },
  }
}

export async function openLocalState(): Promise<{ db: DbClient, credentialStore: SqlCredentialStore, close: () => Promise<void> }> {
  const { db, close } = await openLocalDb()
  const secret = getOrCreateEncryptionSecret()
  const credentialStore = new SqlCredentialStore(db, secret)
  return { db, credentialStore, close }
}

export async function openCredentialStore(): Promise<{ store: SqlCredentialStore, close: () => Promise<void> }> {
  const { credentialStore, close } = await openLocalState()
  return { store: credentialStore, close }
}

export async function saveIntegrationCredentials(spaceId: string, credentialId: string, creds: Record<string, string>): Promise<void> {
  const { store, close } = await openCredentialStore()
  try {
    await store.saveCredentials(spaceId, credentialId, creds)
  }
  finally {
    await close()
  }
}

