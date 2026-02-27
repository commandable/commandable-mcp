import { randomBytes, createHash } from 'node:crypto'
import { eq } from 'drizzle-orm'
import type { DbClient } from '../db/client.js'
import { pgApiKeys, sqliteApiKeys } from '../db/schema.js'

export interface ApiKeyRecord {
  id: string
  name: string
  keyHash: string
  scopesJson?: any
  createdAt: Date
}

export function hashApiKey(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}

export function generateApiKey(): string {
  // Long enough to be unguessable, short enough to copy/paste.
  return randomBytes(24).toString('hex')
}

export async function lookupApiKeyByHash(db: DbClient, keyHash: string): Promise<ApiKeyRecord | null> {
  const table: any = db.dialect === 'sqlite' ? sqliteApiKeys : pgApiKeys
  const rows = await (db.db as any)
    .select()
    .from(table)
    .where(eq(table.keyHash, keyHash))
    .limit(1)
  const row = rows?.[0]
  if (!row)
    return null
  return {
    id: row.id,
    name: row.name,
    keyHash: row.keyHash,
    scopesJson: row.scopesJson ?? undefined,
    createdAt: row.createdAt ?? new Date(),
  }
}

export async function createApiKey(db: DbClient, params: { id: string, name: string, rawKey: string, scopes?: any }): Promise<void> {
  const table: any = db.dialect === 'sqlite' ? sqliteApiKeys : pgApiKeys
  const now = new Date()
  const scopesValue = db.dialect === 'sqlite'
    ? (params.scopes ? JSON.stringify(params.scopes) : null)
    : (params.scopes ?? null)

  await (db.db as any)
    .insert(table)
    .values({
      id: params.id,
      name: params.name,
      keyHash: hashApiKey(params.rawKey),
      scopesJson: scopesValue,
      createdAt: now,
    })
}

export function createBearerAuthMiddleware(opts: { db: DbClient }) {
  return async (req: any, res: any, next: any) => {
    try {
      const header = req?.headers?.authorization
      const value = typeof header === 'string' ? header : Array.isArray(header) ? header[0] : ''
      const m = value.match(/^Bearer\s+(.+)\s*$/i)
      const token = m?.[1]?.trim()
      if (!token) {
        res.status(401).json({ error: 'Missing bearer token' })
        return
      }

      const keyHash = hashApiKey(token)
      const row = await lookupApiKeyByHash(opts.db, keyHash)
      if (!row) {
        res.status(401).json({ error: 'Invalid API key' })
        return
      }

      req.auth = {
        type: 'bearer',
        apiKeyId: row.id,
        name: row.name,
        scopes: row.scopesJson ?? null,
      }

      next()
    }
    catch (err) {
      res.status(500).json({ error: 'Auth error' })
      // eslint-disable-next-line no-console
      console.error(err)
    }
  }
}

