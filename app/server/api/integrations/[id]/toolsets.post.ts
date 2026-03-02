import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { listIntegrations, upsertIntegration } from '@commandable/mcp'
import { getDb } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'id is required' })

  const body = await readBody(event)
  if (!Array.isArray(body?.enabledToolsets))
    throw createError({ statusCode: 400, statusMessage: 'enabledToolsets must be an array' })

  const db = await getDb()
  const integrations = await listIntegrations(db, 'local')
  const integration = integrations.find(i => i.id === id)
  if (!integration)
    throw createError({ statusCode: 404, statusMessage: 'integration not found' })

  // Empty array means "all toolsets enabled" -> store null to avoid filtering out all tools.
  integration.enabledToolsets = Array.isArray(body.enabledToolsets) && body.enabledToolsets.length
    ? body.enabledToolsets.map((value: unknown) => String(value))
    : null
  await upsertIntegration(db, integration)

  return { ok: true, enabledToolsets: integration.enabledToolsets ?? null }
})
