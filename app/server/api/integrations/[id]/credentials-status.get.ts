import { defineEventHandler, getRouterParam, createError } from 'h3'
import { eq } from 'drizzle-orm'
import {
  findIntegrationTypeConfig,
  SqlCredentialStore,
  getOrCreateEncryptionSecret,
  pgIntegrations,
  sqliteIntegrations,
} from '@commandable/mcp-core'
import { getDb } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'id is required' })

  const encryptionSecret = getOrCreateEncryptionSecret()

  const db = await getDb()
  const table: any = db.dialect === 'sqlite' ? sqliteIntegrations : pgIntegrations
  const rows = await (db.db as any).select().from(table).where(eq(table.id, id)).limit(1)
  const integ = rows?.[0]
  if (!integ)
    throw createError({ statusCode: 404, statusMessage: 'integration not found' })

  const spaceId = (integ.spaceId as string | null | undefined) ?? 'local'
  const typeConfig = await findIntegrationTypeConfig({ db, spaceId, typeSlug: integ.type as string })

  const credentialVariant = integ.credentialVariant as string | null | undefined
  const variantKey = (credentialVariant && typeConfig?.variants[credentialVariant])
    ? credentialVariant
    : (typeConfig?.defaultVariant ?? null)
  const variant = variantKey ? typeConfig?.variants[variantKey] : null
  const fieldNames = Object.keys((variant?.credentialSchema as any)?.properties || {})

  const credentialId = integ.credentialId as string | null | undefined
  if (!credentialId) {
    return {
      hasCredentials: false,
      fieldNames,
      health_status: (integ.healthStatus as string | null) ?? 'disconnected',
      health_checked_at: integ.healthCheckedAt ? new Date(integ.healthCheckedAt).toISOString() : null,
    }
  }

  const store = new SqlCredentialStore(db, encryptionSecret)
  const hasCredentials = await store.hasCredentials(spaceId, credentialId)

  return {
    hasCredentials,
    fieldNames,
    health_status: (integ.healthStatus as string | null) ?? null,
    health_checked_at: integ.healthCheckedAt ? new Date(integ.healthCheckedAt).toISOString() : null,
  }
})
