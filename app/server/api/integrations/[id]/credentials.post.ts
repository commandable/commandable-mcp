import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { SqlCredentialStore, getOrCreateEncryptionSecret, upsertIntegration, pgIntegrations, sqliteIntegrations } from '@commandable/mcp'
import type { IntegrationData } from '@commandable/mcp'
import { getDb } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'id is required' })

  const encryptionSecret = getOrCreateEncryptionSecret()

  const body = await readBody(event)
  if (!body || typeof body !== 'object')
    throw createError({ statusCode: 400, statusMessage: 'credentials payload is required' })

  const db = await getDb()
  const table: any = db.dialect === 'sqlite' ? sqliteIntegrations : pgIntegrations
  const rows = await (db.db as any).select().from(table).where(eq(table.id, id)).limit(1)
  const row = rows?.[0]
  if (!row)
    throw createError({ statusCode: 404, statusMessage: 'integration not found' })

  const integration: IntegrationData = {
    spaceId: row.spaceId ?? 'local',
    id: row.id,
    type: row.type,
    referenceId: row.referenceId,
    label: row.label,
    config: db.dialect === 'sqlite' ? (row.configJson ? JSON.parse(row.configJson) : undefined) : (row.configJson ?? undefined),
    connectionMethod: 'credentials',
    connectionId: null,
    credentialId: row.credentialId || `${row.referenceId}-creds`,
  }

  const store = new SqlCredentialStore(db, encryptionSecret)
  await store.saveCredentials('local', integration.credentialId!, body as any)

  await upsertIntegration(db, integration)

  return { ok: true, credentialId: integration.credentialId }
})

