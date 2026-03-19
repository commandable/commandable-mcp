import type { CredentialVariantConfig } from '../../../types/integration'
import { findIntegrationTypeConfig, getIntegrationById } from '@commandable/mcp-core'
import { createError, defineEventHandler, getRouterParam } from 'h3'
import { getDb } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'id is required' })

  const db = await getDb()
  const integ = await getIntegrationById(db, id)
  if (!integ)
    throw createError({ statusCode: 404, statusMessage: 'integration not found' })

  const spaceId = integ.spaceId ?? 'local'
  const typeConfig = await findIntegrationTypeConfig({ db, spaceId, typeSlug: integ.type })
  if (!typeConfig)
    return { supportsCredentials: false, variants: [], defaultVariant: null }

  return {
    supportsCredentials: true,
    variants: Object.entries(typeConfig.variants as Record<string, CredentialVariantConfig>).map(([key, variant]) => ({
      key,
      label: variant.label,
      schema: variant.credentialSchema,
      hintMarkdown: variant.hintMarkdown ?? null,
    })),
    defaultVariant: typeConfig.defaultVariant,
  }
})
