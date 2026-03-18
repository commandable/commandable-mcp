import {
  getIntegrationById,
  getOrCreateEncryptionSecret,
  SqlCredentialStore,
  updateIntegrationCredentials,
  updateIntegrationHealth,
} from '@commandable/mcp-core'
import { createError, defineEventHandler, getRouterParam } from 'h3'
import { getDb } from '../../../utils/db'
import { refreshMcpState } from '../../../utils/mcp'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'id is required' })

  const db = await getDb()
  const integ = await getIntegrationById(db, id)
  if (!integ)
    throw createError({ statusCode: 404, statusMessage: 'integration not found' })

  const credentialId = integ.credentialId
  if (credentialId) {
    const spaceId = integ.spaceId ?? 'local'
    const encryptionSecret = getOrCreateEncryptionSecret()
    const store = new SqlCredentialStore(db, encryptionSecret)
    await store.deleteCredentials(spaceId, credentialId)
  }

  // Clear credential linkage — preserves toolsets/permissions
  await updateIntegrationCredentials(db, id, {
    connectionMethod: null,
    credentialId: null,
    credentialVariant: null,
  })

  // Mark as disconnected
  await updateIntegrationHealth(db, id, 'disconnected')
  await refreshMcpState()

  return { ok: true }
})
