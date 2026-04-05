import {
  createGetIntegration,
  createSafeHandlerFromString,
  findIntegrationTypeConfig,
  getIntegrationById,
  getOrCreateEncryptionSecret,
  IntegrationProxy,
  loadIntegrationManifest,
  SqlCredentialStore,
} from '@commandable/mcp-core'
import { createError } from 'h3'
import { getDb } from './db'

interface RunVariantConfigListHandlerParams {
  integrationId: string
  forIntegrationType: string
  key: string
  config?: Record<string, unknown>
}

interface VariantConfigDescriptor {
  key: string
  label: string
  selectionMode: 'single' | 'multi'
  listHandler?: string
}

export async function runVariantConfigListHandler(params: RunVariantConfigListHandlerParams) {
  const manifest = loadIntegrationManifest(params.forIntegrationType) as { variantConfig?: VariantConfigDescriptor[] } | null
  if (!manifest)
    throw createError({ statusCode: 404, statusMessage: 'Variant integration type not found' })

  const variantConfig = manifest.variantConfig?.find((item: VariantConfigDescriptor) => item.key === params.key)
  if (!variantConfig)
    throw createError({ statusCode: 404, statusMessage: `Variant config '${params.key}' not found` })
  if (!variantConfig.listHandler)
    throw createError({ statusCode: 400, statusMessage: `Variant config '${params.key}' has no list handler` })

  const db = await getDb()
  const integration = await getIntegrationById(db, params.integrationId)
  if (!integration)
    throw createError({ statusCode: 404, statusMessage: 'Integration not found' })

  const spaceId = integration.spaceId ?? 'local'
  const typeConfig = await findIntegrationTypeConfig({
    db,
    spaceId,
    typeSlug: integration.type,
  })

  const proxy = new IntegrationProxy({
    credentialStore: new SqlCredentialStore(db, getOrCreateEncryptionSecret()),
    integrationTypeConfigsRef: typeConfig ? { current: [typeConfig] } : undefined,
  })

  const getIntegration = createGetIntegration([integration], proxy)
  const wrappedHandler = `async (config) => {\n  const integration = getIntegration('${integration.id}');\n  const __handler = ${variantConfig.listHandler};\n  const __config = (config && typeof config === 'object' && !Array.isArray(config)) ? config : {};\n  return await __handler(__config);\n}`
  const runner = createSafeHandlerFromString(wrappedHandler, getIntegration)
  const result = await runner(params.config ?? {})

  if (!result.success) {
    const innerStatusCode = typeof result.result?.statusCode === 'number' ? result.result.statusCode : 500
    const innerMessage = typeof result.result?.message === 'string' && result.result.message.trim()
      ? result.result.message.trim()
      : 'Failed to load variant config options'
    throw createError({ statusCode: innerStatusCode, statusMessage: innerMessage, data: result.logs })
  }
  if (!Array.isArray(result.result))
    throw createError({ statusCode: 502, statusMessage: 'Variant config list handler must return an array' })

  const options = result.result
    .map((item) => {
      if (!item || typeof item !== 'object')
        return null
      const id = 'id' in item ? String(item.id ?? '') : ''
      const name = 'name' in item ? String(item.name ?? '') : ''
      if (!id || !name)
        return null
      return { id, name }
    })
    .filter(Boolean)

  return {
    label: variantConfig.label,
    selectionMode: variantConfig.selectionMode,
    options,
    logs: result.logs,
  }
}
