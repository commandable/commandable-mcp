import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { listIntegrations, upsertIntegration } from '@commandable/mcp'
import { getDb } from '../../../utils/db'
import { refreshMcpState } from '../../../utils/mcp'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'id is required' })

  const body = await readBody(event)

  const db = await getDb()
  const spaceId = (process.env.COMMANDABLE_SPACE_ID || 'local').trim() || 'local'
  const integrations = await listIntegrations(db, spaceId)
  const integration = integrations.find(i => i.id === id)
  if (!integration)
    throw createError({ statusCode: 404, statusMessage: 'integration not found' })

  // maxScope: 'read' | 'write' | null — null clears the cap
  if ('maxScope' in body)
    integration.maxScope = body.maxScope === 'read' || body.maxScope === 'write' ? body.maxScope : null

  // disabledTools: string[] | null — null or empty array clears the blocklist
  if ('disabledTools' in body)
    integration.disabledTools = Array.isArray(body.disabledTools) && body.disabledTools.length ? body.disabledTools.map(String) : null

  await upsertIntegration(db, integration)
  await refreshMcpState()

  return { ok: true, maxScope: integration.maxScope ?? null, disabledTools: integration.disabledTools ?? null }
})
