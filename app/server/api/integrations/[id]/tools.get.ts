import type { ToolListItem } from '@commandable/mcp-core'
import {
  applyFileProcessingCapabilityToIntegration,
  getFileProcessingCapability,
  getIntegrationById,
  listToolDefinitionsForIntegration,
  loadIntegrationToolList,
} from '@commandable/mcp-core'
import { createError, defineEventHandler, getRouterParam } from 'h3'
import { getDb } from '../../../utils/db'

const UNDERSCORE_RE = /_/g
const WHITESPACE_RE = /\s+/g

type ToolItem = ToolListItem & { custom?: boolean }

function humanizeName(s: string): string {
  return (s || '')
    .replace(UNDERSCORE_RE, ' ')
    .split(WHITESPACE_RE)
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

  const runtimeIntegration = applyFileProcessingCapabilityToIntegration(
    integration,
    await getFileProcessingCapability(),
  )
  const builtIn = loadIntegrationToolList(runtimeIntegration.type, {
    credentialVariant: runtimeIntegration.credentialVariant ?? undefined,
    toolsets: runtimeIntegration.enabledToolsets ?? undefined,
    maxScope: runtimeIntegration.maxScope ?? undefined,
    disabledTools: runtimeIntegration.disabledTools ?? undefined,
  })
  const customDefs = await listToolDefinitionsForIntegration(db, integration.spaceId || 'local', integration.id)
  const custom: ToolItem[] = customDefs.map(def => ({
    name: def.name,
    displayName: def.displayName || humanizeName(def.name),
    description: def.description,
    scope: def.scope,
    toolset: 'custom',
    custom: true,
  }))
  return [...builtIn, ...custom]
})
