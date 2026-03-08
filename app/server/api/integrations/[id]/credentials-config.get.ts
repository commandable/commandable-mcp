import { defineEventHandler, getRouterParam, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { findIntegrationTypeConfig, pgIntegrations, sqliteIntegrations } from '@commandable/mcp-core'
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

  const spaceId = (integ.spaceId as string | null | undefined) ?? 'local'
  const typeConfig = await findIntegrationTypeConfig({ db, spaceId, typeSlug: integ.type as string })
  if (!typeConfig)
    return { supportsCredentials: false, variants: [], defaultVariant: null }

  return {
    supportsCredentials: true,
    variants: Object.entries(typeConfig.variants).map(([key, variant]: [string, any]) => ({
      key,
      label: variant.label,
      schema: variant.credentialSchema,
      hintMarkdown: variant.hintMarkdown ?? null,
    })),
    defaultVariant: typeConfig.defaultVariant,
  }
})
