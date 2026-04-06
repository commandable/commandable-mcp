import { loadIntegrationHint, loadIntegrationManifest, loadIntegrationVariants } from '@commandable/integration-data'
import type { IntegrationCredentialVariant, IntegrationTypeConfig } from '../types.js'

function isHandlerPreprocess(preprocess: unknown): preprocess is {
  type: 'handler'
  handlerCode: string
  allowedOrigins?: string[]
} {
  return typeof preprocess === 'object'
    && preprocess !== null
    && (preprocess as any).type === 'handler'
    && typeof (preprocess as any).handlerCode === 'string'
}

/**
 * Read a built-in integration type config from the file-backed integration-data package.
 * Returns null when the integration type has no credentials.json definition.
 */
export function getBuiltInIntegrationTypeConfig(typeSlug: string): IntegrationTypeConfig | null {
  const variantsFile = loadIntegrationVariants(typeSlug)
  if (!variantsFile)
    return null

  const manifest = loadIntegrationManifest(typeSlug)
  const manifestBaseUrl = manifest?.baseUrl ?? null
  const manifestAllowedOrigins = manifest?.allowedOrigins ?? null

  const variants: Record<string, IntegrationCredentialVariant> = {}
  for (const [key, variant] of Object.entries(variantsFile.variants) as [string, typeof variantsFile.variants[string]][]) {
    const preprocess = variant.preprocess ?? null
    const isSupportedHandler = isHandlerPreprocess(preprocess)
    if (preprocess !== null && preprocess !== 'google_service_account' && !isSupportedHandler) {
      throw new Error(`Unsupported preprocess for built-in integration '${typeSlug}/${key}'.`)
    }

    variants[key] = {
      label: variant.label,
      credentialSchema: variant.schema,
      auth: { kind: 'template', injection: variant.injection || {} },
      baseUrl: manifestBaseUrl,
      baseUrlTemplate: typeof (variant as any).baseUrlTemplate === 'string' ? (variant as any).baseUrlTemplate : null,
      allowedOrigins: manifestAllowedOrigins,
      healthCheck: variant.healthCheck ?? null,
      hintMarkdown: loadIntegrationHint(typeSlug, key),
      preprocess: isSupportedHandler
        ? {
            type: 'handler',
            handlerCode: preprocess.handlerCode,
            allowedOrigins: Array.isArray(preprocess.allowedOrigins) ? [...preprocess.allowedOrigins] : null,
          }
        : preprocess,
    }
  }

  return {
    typeSlug,
    label: typeSlug,
    defaultVariant: variantsFile.default,
    variants,
  }
}
