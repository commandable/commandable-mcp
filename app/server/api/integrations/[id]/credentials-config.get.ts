import { defineEventHandler, getRouterParam, createError } from 'h3'
import { eq } from 'drizzle-orm'
import {
  loadIntegrationVariants,
  loadIntegrationHint,
  pgIntegrations,
  sqliteIntegrations,
  getIntegrationTypeConfig,
} from '@commandable/mcp'
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
  const spaceId = (integ.spaceId as string | null | undefined) ?? 'local'

  // Try file-system bundled integration data first (pre-built integrations)
  const variantsFile = loadIntegrationVariants(type)
  if (variantsFile) {
    const variants = Object.entries(variantsFile.variants).map(([key, variant]) => ({
      key,
      label: variant.label,
      schema: variant.schema,
      hintMarkdown: loadIntegrationHint(type, key),
    }))
    return {
      supportsCredentials: true,
      variants,
      defaultVariant: variantsFile.default,
    }
  }

  // Fall back to DB-stored config for custom integrations
  const customCfg = await getIntegrationTypeConfig(db, spaceId, type)
  if (customCfg) {
    return {
      supportsCredentials: true,
      variants: [{
        key: 'default',
        label: customCfg.label,
        schema: customCfg.credentialSchema,
        hintMarkdown: null,
      }],
      defaultVariant: 'default',
    }
  }

  return { supportsCredentials: false, variants: [], defaultVariant: null }
})
