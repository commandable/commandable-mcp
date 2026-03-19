import type { IntegrationData } from '@commandable/mcp-core'
import {
  checkIntegrationHealth,
  findIntegrationTypeConfig,
  getIntegrationById,
  getOrCreateEncryptionSecret,
  IntegrationProxy,
  SqlCredentialStore,
  updateIntegrationCredentials,
  updateIntegrationHealth,
} from '@commandable/mcp-core'
import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
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
  const integ = await getIntegrationById(db, id)
  if (!integ)
    throw createError({ statusCode: 404, statusMessage: 'integration not found' })

  const payload = body as Record<string, unknown>
  const credentialVariant = payload.credentialVariant
  const credentialValues = Object.fromEntries(
    Object.entries(payload).filter(
      (entry): entry is [string, string] => entry[0] !== 'credentialVariant' && typeof entry[1] === 'string',
    ),
  )

  const spaceId = integ.spaceId ?? 'local'
  const credentialId: string = integ.credentialId || `${integ.referenceId}-creds`
  const resolvedVariant: string | null = (typeof credentialVariant === 'string' ? credentialVariant : null) || integ.credentialVariant || null

  const store = new SqlCredentialStore(db, encryptionSecret)
  await store.saveCredentials(spaceId, credentialId, credentialValues)

  // Update only credential linkage fields — preserves toolsets/permissions
  await updateIntegrationCredentials(db, id, {
    connectionMethod: 'credentials',
    credentialId,
    credentialVariant: resolvedVariant,
  })

  const typeConfig = await findIntegrationTypeConfig({
    db,
    spaceId,
    typeSlug: integ.type,
  })

  const integrationForCheck: IntegrationData = {
    ...integ,
    connectionMethod: 'credentials',
    credentialId,
    credentialVariant: resolvedVariant,
  }

  const proxy = new IntegrationProxy({
    credentialStore: store,
    integrationTypeConfigsRef: typeConfig
      ? { current: [typeConfig] }
      : undefined,
  })

  const healthResult = await checkIntegrationHealth({
    integration: integrationForCheck,
    proxy,
    db,
  })

  // Always persist health status — even skipped checks resolve as 'connected'
  await updateIntegrationHealth(db, id, healthResult.status, healthResult.checkedAt)

  await refreshMcpState()

  return {
    ok: true,
    credentialId,
    health_status: healthResult.status,
    health_checked_at: healthResult.checkedAt?.toISOString(),
  }
})
