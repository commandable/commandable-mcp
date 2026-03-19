import { getIntegrationById, listToolDefinitionsForIntegration, loadIntegrationToolsets } from '@commandable/mcp-core'
import { createError, defineEventHandler, getRouterParam } from 'h3'
import { getDb } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'id is required' })

  const db = await getDb()
  const integration = await getIntegrationById(db, id)
  if (!integration)
    throw createError({ statusCode: 404, statusMessage: 'Integration not found' })

  const toolsets = loadIntegrationToolsets(integration.type) ?? {}
  const customDefs = await listToolDefinitionsForIntegration(db, integration.spaceId || 'local', integration.id)
  if (customDefs.length) {
    toolsets.custom = {
      label: 'Custom Tools',
      description: `Agent-created tools for ${integration.label}`,
    }
  }
  return toolsets
})
