import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { eq } from 'drizzle-orm'
import {
  SqlCredentialStore,
  IntegrationProxy,
  getOrCreateEncryptionSecret,
  updateIntegrationCredentials,
  updateIntegrationHealth,
  checkIntegrationHealth,
  pgIntegrations,
  sqliteIntegrations,
} from '@commandable/mcp'
import type { IntegrationData } from '@commandable/mcp'
import { getDb } from '../../../utils/db'
import { refreshMcpState } from '../../../utils/mcp'

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

  // Extract credentialVariant from the payload (not part of the credential values themselves)
  const { credentialVariant, ...credentialValues } = body

  const spaceId = row.spaceId ?? 'local'
  const credentialId: string = row.credentialId || `${row.referenceId}-creds`
  const resolvedVariant: string | null = credentialVariant || row.credentialVariant || null

  const store = new SqlCredentialStore(db, encryptionSecret)
  await store.saveCredentials(spaceId, credentialId, credentialValues as any)

  // Update only credential linkage fields — preserves toolsets/permissions
  await updateIntegrationCredentials(db, id, {
    connectionMethod: 'credentials',
    credentialId,
    credentialVariant: resolvedVariant,
  })

  // Run health check against the newly saved credentials
  const integrationForCheck: IntegrationData = {
    spaceId,
    id,
    type: row.type,
    referenceId: row.referenceId,
    label: row.label,
    connectionMethod: 'credentials',
    credentialId,
    credentialVariant: resolvedVariant,
  }

  const proxy = new IntegrationProxy({
    credentialStore: store,
    trelloApiKey: process.env.TRELLO_API_KEY,
  })

  const healthResult = await checkIntegrationHealth({ integration: integrationForCheck, proxy })

  // Persist health status (skip if the provider has no health endpoint)
  if (!healthResult.skipped) {
    await updateIntegrationHealth(db, id, healthResult.status, healthResult.checkedAt)
  }
  await refreshMcpState()

  return {
    ok: true,
    credentialId,
    health_status: healthResult.status,
    health_checked_at: healthResult.skipped ? null : healthResult.checkedAt?.toISOString(),
  }
})
