import { randomUUID } from 'node:crypto'
import { createError, defineEventHandler, readBody } from 'h3'
import type { IntegrationData } from '@commandable/mcp'
import { upsertIntegration } from '@commandable/mcp'
import { getDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const id = body?.id || randomUUID()
  const spaceId = (process.env.COMMANDABLE_SPACE_ID || 'local').trim() || 'local'

  const integration: IntegrationData = {
    spaceId,
    id,
    type: body?.type,
    referenceId: body?.referenceId || body?.type,
    label: body?.label || body?.type,
    enabled: typeof body?.enabled === 'boolean' ? body.enabled : true,
    config: body?.config || undefined,
    connectionMethod: body?.connectionMethod || undefined,
    connectionId: body?.connectionId || undefined,
    credentialId: body?.credentialId || undefined,
    // Empty array means "all toolsets enabled" -> store null/undefined (no filtering).
    enabledToolsets: Array.isArray(body?.enabledToolsets) && body.enabledToolsets.length ? body.enabledToolsets : undefined,
    maxScope: body?.maxScope === 'read' || body?.maxScope === 'write' ? body.maxScope : undefined,
    disabledTools: Array.isArray(body?.disabledTools) && body.disabledTools.length ? body.disabledTools : undefined,
  }

  if (!integration.type)
    throw createError({ statusCode: 400, statusMessage: 'type is required' })

  const db = await getDb()
  await upsertIntegration(db, integration)
  return integration
})

