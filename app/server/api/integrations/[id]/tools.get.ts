import { createError, defineEventHandler, getRouterParam } from 'h3'
import { getIntegrationById, listToolDefinitionsForIntegration, loadIntegrationToolList } from '@commandable/mcp-core'
import { getDb } from '../../../utils/db'

type ToolItem = {
  name: string
  displayName: string
  description: string
  scope: 'read' | 'write' | 'admin'
  toolset?: string
  custom?: boolean
}

function humanizeName(s: string): string {
  return (s || '')
    .replace(/_/g, ' ')
    .split(/\s+/g)
    .filter(Boolean)
    .map(w => (w.length ? `${w[0]!.toUpperCase()}${w.slice(1).toLowerCase()}` : w))
    .join(' ')
}

export default defineEventHandler(async (event): Promise<ToolItem[]> => {
  const id = getRouterParam(event, 'id')
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'id is required' })

  const db = await getDb()
  const integration = await getIntegrationById(db, id)
  if (!integration)
    throw createError({ statusCode: 404, statusMessage: 'Integration not found' })

  const builtIn = loadIntegrationToolList(integration.type)
  const customDefs = await listToolDefinitionsForIntegration(db, integration.spaceId || 'local', integration.id)
  const custom: ToolItem[] = customDefs.map(def => ({
    name: def.name,
    displayName: def.displayName || humanizeName(def.name),
    description: def.description,
    scope: def.scope,
    toolset: 'custom',
    custom: true
  }))
  return [...builtIn, ...custom]
})
