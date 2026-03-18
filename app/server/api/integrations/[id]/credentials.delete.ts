import { defineEventHandler, getRouterParam, createError } from 'h3'
import { eq } from 'drizzle-orm'
import {
  SqlCredentialStore,
  getOrCreateEncryptionSecret,
  updateIntegrationCredentials,
  updateIntegrationHealth,
  pgIntegrations,
  sqliteIntegrations
} from '@commandable/mcp-core'
import { getDb } from '../../../utils/db'
import { refreshMcpState } from '../../../utils/mcp'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'id is required' })

  const db = await getDb()
  const table: any = db.dialect === 'sqlite' ? sqliteIntegrations : pgIntegrations
  const rows = await (db.db as any).select().from(table).where(eq(table.id, id)).limit(1)
  const row = rows?.[0]
  if (!row)
    throw createError({ statusCode: 404, statusMessage: 'integration not found' })

  const credentialId = row.credentialId as string | null | undefined
  if (credentialId) {
    const spaceId = row.spaceId ?? 'local'
    const encryptionSecret = getOrCreateEncryptionSecret()
    const store = new SqlCredentialStore(db, encryptionSecret)
    await store.deleteCredentials(spaceId, credentialId)
  }

  // Clear credential linkage — preserves toolsets/permissions
  await updateIntegrationCredentials(db, id, {
    connectionMethod: null,
    credentialId: null,
    credentialVariant: null
  })

  // Mark as disconnected
  await updateIntegrationHealth(db, id, 'disconnected')
  await refreshMcpState()

  return { ok: true }
})
