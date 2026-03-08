import { createError, defineEventHandler, getRouterParam } from 'h3'
import { loadIntegrationToolsets } from '@commandable/mcp-core'

export default defineEventHandler((event) => {
  const type = getRouterParam(event, 'type')
  if (!type)
    throw createError({ statusCode: 400, statusMessage: 'type is required' })

  const toolsets = loadIntegrationToolsets(type)
  return toolsets ?? {}
})
