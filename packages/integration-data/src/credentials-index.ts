import type { CredentialVariantsFile } from './types.js'
import { GENERATED_INTEGRATIONS } from './generated/registry.js'

export type { CredentialVariantConfig, CredentialVariantsFile } from './types.js'

export interface IntegrationCredentials {
  variants: CredentialVariantsFile
  hints: Record<string, string>
}

export const credentialConfigs: Record<string, IntegrationCredentials> = Object.fromEntries(
  Object.entries(GENERATED_INTEGRATIONS)
    .filter(([, integration]) => Boolean(integration.variants))
    .map(([type, integration]) => {
      const variants = integration.variants!
      const hints = Object.fromEntries(
        Object.keys(variants.variants).map((variantKey) => [
          variantKey,
          integration.hintsByVariant[variantKey] || integration.hint || '',
        ]),
      )

      return [type, { variants, hints }]
    }),
)
