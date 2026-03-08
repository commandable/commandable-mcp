import { defineEventHandler, getRouterParam } from 'h3'
import { eq } from 'drizzle-orm'
import { pgIntegrations, sqliteIntegrations } from '@commandable/mcp-core'
import { getDb } from '../../utils/db'
import { refreshMcpState } from '../../utils/mcp'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id)
    return { ok: true }

  const db = await getDb()
  const table: any = db.dialect === 'sqlite' ? sqliteIntegrations : pgIntegrations
  await (db.db as any).delete(table).where(eq(table.id, id))
  await refreshMcpState()
  return { ok: true }
})

