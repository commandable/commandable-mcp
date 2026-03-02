import { createError, defineEventHandler, getRouterParam } from 'h3'
import { loadIntegrationToolList } from '@commandable/mcp'

export default defineEventHandler((event) => {
  const type = getRouterParam(event, 'type')
  if (!type)
    throw createError({ statusCode: 400, statusMessage: 'type is required' })

  return loadIntegrationToolList(type)
})
