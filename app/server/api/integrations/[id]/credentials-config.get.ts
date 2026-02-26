import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { loadIntegrationCredentialConfig, pgIntegrations, sqliteIntegrations } from '@commandable/mcp'
import { getDb } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'id is required' })

  const db = await getDb()
  const table: any = db.dialect === 'sqlite' ? sqliteIntegrations : pgIntegrations
  const rows = await (db.db as any).select().from(table).where(eq(table.id, id)).limit(1)
  const integ = rows?.[0]
  if (!integ)
    throw createError({ statusCode: 404, statusMessage: 'integration not found' })

  const type = integ.type as string
  const cfg = loadIntegrationCredentialConfig(type)
  if (!cfg) {
    return { supportsCredentials: false, schema: null, hintMarkdown: null }
  }

  const root = process.env.COMMANDABLE_INTEGRATION_DATA_DIR
  let hintMarkdown: string | null = null
  if (root) {
    const hintPath = resolve(root, type, 'credentials_hint.md')
    if (existsSync(hintPath)) {
      try { hintMarkdown = readFileSync(hintPath, 'utf8') }
      catch { hintMarkdown = null }
    }
  }

  return {
    supportsCredentials: true,
    schema: cfg.schema,
    hintMarkdown,
  }
})

