import { loadIntegrationHint, loadIntegrationManifest, loadIntegrationVariants } from '@commandable/integration-data'
import type { IntegrationCredentialVariant, IntegrationTypeConfig } from '../types.js'

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

  const variants: Record<string, IntegrationCredentialVariant> = {}
  for (const [key, variant] of Object.entries(variantsFile.variants)) {
    const preprocess = variant.preprocess ?? null
    if (preprocess !== null && preprocess !== 'google_service_account') {
      throw new Error(`Unsupported preprocess '${preprocess}' for built-in integration '${typeSlug}/${key}'. Only 'google_service_account' is allowed.`)
    }

    variants[key] = {
      label: variant.label,
      credentialSchema: variant.schema,
      auth: { kind: 'template', injection: variant.injection || {} },
      baseUrl: manifestBaseUrl,
      baseUrlTemplate: typeof (variant as any).baseUrlTemplate === 'string' ? (variant as any).baseUrlTemplate : null,
      healthCheck: (variant as any).healthCheck ?? null,
      hintMarkdown: loadIntegrationHint(typeSlug, key),
      preprocess,
    }
  }

  return {
    typeSlug,
    label: typeSlug,
    defaultVariant: variantsFile.default,
    variants,
  }
}
