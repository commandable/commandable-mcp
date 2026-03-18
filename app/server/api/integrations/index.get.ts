import { listIntegrations } from '@commandable/mcp-core'
import { defineEventHandler } from 'h3'
import { getDb } from '../../utils/db'

export default defineEventHandler(async () => {
  const db = await getDb()
  const spaceId = (process.env.COMMANDABLE_SPACE_ID || 'local').trim() || 'local'
  return await listIntegrations(db, spaceId)
})
