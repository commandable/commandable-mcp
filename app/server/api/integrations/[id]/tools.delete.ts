import { deleteToolDefinitionByName, getIntegrationById } from '@commandable/mcp-core'
import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { getDb } from '../../../utils/db'
import { refreshMcpState } from '../../../utils/mcp'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'id is required' })

  const body = await readBody(event)
  const name = String(body?.name || '').trim()
  if (!name)
    throw createError({ statusCode: 400, statusMessage: 'name is required' })

  const db = await getDb()
  const integration = await getIntegrationById(db, id)
  if (!integration)
    throw createError({ statusCode: 404, statusMessage: 'Integration not found' })

  const deleted = await deleteToolDefinitionByName(db, integration.spaceId || 'local', integration.id, name)
  if (deleted)
    await refreshMcpState()

  return { ok: true, deleted: deleted > 0 }
})
