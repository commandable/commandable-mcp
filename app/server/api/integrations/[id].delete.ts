import { defineEventHandler, getRouterParam } from 'h3'
import {
  SqlCredentialStore,
  deleteIntegrationById,
  deleteIntegrationTypeConfig,
  deleteToolDefinitionsForIntegration,
  getIntegrationById,
  getOrCreateEncryptionSecret,
  listIntegrations
} from '@commandable/mcp-core'
import { getDb } from '../../utils/db'
import { refreshMcpState } from '../../utils/mcp'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id)
    return { ok: true }

  const db = await getDb()
  const integration = await getIntegrationById(db, id)
  if (!integration)
    return { ok: true, deleted: false }

  const spaceId = integration.spaceId || (process.env.COMMANDABLE_SPACE_ID || 'local').trim() || 'local'
  await deleteToolDefinitionsForIntegration(db, spaceId, integration.id)
  if (integration.connectionMethod === 'credentials' && integration.credentialId) {
    const credentialStore = new SqlCredentialStore(db, getOrCreateEncryptionSecret())
    await credentialStore.deleteCredentials(spaceId, integration.credentialId)
  }
  await deleteIntegrationById(db, integration.id)

  const remaining = await listIntegrations(db, spaceId)
  if (!remaining.some(i => i.type === integration.type))
    await deleteIntegrationTypeConfig(db, spaceId, integration.type)

  await refreshMcpState()
  return { ok: true, deleted: true }
})
