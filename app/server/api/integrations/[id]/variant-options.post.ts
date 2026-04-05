import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { getIntegrationById, listIntegrationCatalog } from '@commandable/mcp-core'
import { getDb } from '../../../utils/db'
import { runVariantConfigListHandler } from '../../../utils/runVariantConfigListHandler'

interface CatalogFamily {
  type: string
  variants?: { type: string }[] | null
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'id is required' })

  const body = await readBody(event)
  const forIntegrationType = typeof body?.forIntegrationType === 'string' ? body.forIntegrationType : ''
  const key = typeof body?.key === 'string' ? body.key : ''
  const config = body?.config && typeof body.config === 'object' && !Array.isArray(body.config)
    ? body.config as Record<string, unknown>
    : {}

  if (!forIntegrationType || !key)
    throw createError({ statusCode: 400, statusMessage: 'forIntegrationType and key are required' })

  const db = await getDb()
  const integration = await getIntegrationById(db, id)
  if (!integration)
    throw createError({ statusCode: 404, statusMessage: 'Integration not found' })

  const catalog = listIntegrationCatalog() as CatalogFamily[]
  const family = catalog.find(entry =>
    entry.type === integration.type
    || entry.variants?.some(variant => variant.type === integration.type),
  )
  if (!family)
    throw createError({ statusCode: 404, statusMessage: 'Integration family not found' })

  const isSameType = family.type === forIntegrationType || integration.type === forIntegrationType
  const isKnownVariant = family.variants?.some(variant => variant.type === forIntegrationType)

  if (!isSameType && !isKnownVariant)
    throw createError({ statusCode: 400, statusMessage: 'Variant integration type is not compatible with this integration' })

  return await runVariantConfigListHandler({
    integrationId: id,
    forIntegrationType,
    key,
    config,
  })
})
