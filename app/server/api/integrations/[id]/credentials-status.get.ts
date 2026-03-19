import type { CredentialSchemaShape } from '../../../types/integration'
import {
  findIntegrationTypeConfig,
  getIntegrationById,
  getOrCreateEncryptionSecret,
  SqlCredentialStore,
} from '@commandable/mcp-core'
import { createError, defineEventHandler, getRouterParam } from 'h3'
import { getDb } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'id is required' })

  const encryptionSecret = getOrCreateEncryptionSecret()

  const db = await getDb()
  const integ = await getIntegrationById(db, id)
  if (!integ)
    throw createError({ statusCode: 404, statusMessage: 'integration not found' })

  const spaceId = integ.spaceId ?? 'local'
  const typeConfig = await findIntegrationTypeConfig({ db, spaceId, typeSlug: integ.type })

  const credentialVariant = integ.credentialVariant
  const variantKey = (credentialVariant && typeConfig?.variants[credentialVariant])
    ? credentialVariant
    : (typeConfig?.defaultVariant ?? null)
  const variant = variantKey ? typeConfig?.variants[variantKey] : null
  const fieldNames = Object.keys((variant?.credentialSchema as CredentialSchemaShape | undefined)?.properties || {})

  const credentialId = integ.credentialId
  if (!credentialId) {
    return {
      hasCredentials: false,
      fieldNames,
      health_status: integ.healthStatus ?? 'disconnected',
      health_checked_at: integ.healthCheckedAt ? new Date(integ.healthCheckedAt).toISOString() : null,
    }
  }

  const store = new SqlCredentialStore(db, encryptionSecret)
  const hasCredentials = await store.hasCredentials(spaceId, credentialId)

  return {
    hasCredentials,
    fieldNames,
    health_status: integ.healthStatus ?? null,
    health_checked_at: integ.healthCheckedAt ? new Date(integ.healthCheckedAt).toISOString() : null,
  }
})
