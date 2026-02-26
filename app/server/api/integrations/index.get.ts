import { defineEventHandler } from 'h3'
import { listIntegrations } from '@commandable/mcp'
import { getDb } from '../../utils/db'

export default defineEventHandler(async () => {
  const db = await getDb()
  return await listIntegrations(db, 'local')
})

