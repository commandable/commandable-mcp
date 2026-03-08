import crypto from 'node:crypto'
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { resolve } from 'node:path'
import { createDb, type DbClient } from '../db/client.js'
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
  const envSecret = process.env.COMMANDABLE_ENCRYPTION_SECRET
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

export async function openLocalDb(): Promise<{ db: DbClient, close: () => Promise<void> }> {
  const dir = getCommandableDir()
  const envSqlite = process.env.COMMANDABLE_MCP_SQLITE_PATH
  const sqlitePath = envSqlite && envSqlite.trim().length
    ? resolve(envSqlite.trim())
    : resolve(dir, 'credentials.sqlite')
  const client = createDb({ sqlitePath })
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

