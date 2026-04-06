import type { JSONSchema7 } from 'json-schema'

export interface CredentialPreprocessHandlerConfig {
  type: 'handler'
  handlerCode: string
  allowedOrigins?: string[]
}

export type CredentialPreprocessConfig = string | CredentialPreprocessHandlerConfig

export interface CredentialVariantConfig {
  label: string
  schema: JSONSchema7
  baseUrlTemplate?: string
  injection: {
    headers?: Record<string, string>
    query?: Record<string, string>
  }
  preprocess?: CredentialPreprocessConfig
  healthCheck:
    | {
      path: string
      method?: string
    }
    | {
      notViable: true
    }
}

export interface CredentialVariantsFile {
  variants: Record<string, CredentialVariantConfig>
  default: string
}

export interface IntegrationCredentialConfig {
  variantKey: string
  label: string
  schema: JSONSchema7
  baseUrlTemplate?: string
  injection: {
    headers?: Record<string, string>
    query?: Record<string, string>
  }
  preprocess?: CredentialPreprocessConfig
  healthCheck:
    | {
      path: string
      method?: string
    }
    | {
      notViable: true
    }
}

export interface ManifestToolRef {
  name: string
  from?: string
  description?: string
  inputSchema?: string
  handler?: string
  scope?: 'read' | 'write' | 'admin'
  credentialVariants?: string[]
  toolset?: string
  injectFromConfig?: Record<string, string>
}

export interface ToolRef {
  name: string
  description: string
  inputSchema: string
  handler: string
  scope?: 'read' | 'write' | 'admin'
  credentialVariants?: string[]
  toolset?: string
  injectFromConfig?: Record<string, string>
}

export interface ToolsetMeta {
  label: string
  description: string
}

export interface ToolListItem {
  name: string
  displayName: string
  description: string
  scope: 'read' | 'write' | 'admin'
  toolset?: string
}

export interface ToolData {
  name: string
  displayName?: string
  description: string
  inputSchema: JSONSchema7 | Record<string, unknown>
  handlerCode: string
  utils?: string[]
  injectFromConfig?: Record<string, string>
}

export type VariantConfigSelectionMode = 'single' | 'multi'

export interface VariantConfigItem {
  key: string
  label: string
  selectionMode: VariantConfigSelectionMode
  listHandler?: string
}

export interface IntegrationVariantRef {
  type: string
  manifest: string
}

export interface IntegrationManifestFile {
  name: string
  version?: string
  baseUrl?: string
  allowedOrigins?: string[]
  utils?: string[]
  toolsets?: Record<string, ToolsetMeta>
  variants?: IntegrationVariantRef[]
  tools: ManifestToolRef[]
}

export interface VariantManifestFile {
  type: string
  variantLabel: string
  variantConfig?: VariantConfigItem[]
  tools: ManifestToolRef[]
}

export interface Manifest {
  name: string
  version?: string
  baseUrl?: string
  allowedOrigins?: string[]
  utils?: string[]
  toolsets?: Record<string, ToolsetMeta>
  variantLabel?: string
  variantConfig?: VariantConfigItem[]
  tools: ToolRef[]
}

export interface IntegrationCatalogVariantConfigItem {
  key: string
  label: string
  selectionMode: VariantConfigSelectionMode
  hasListHandler: boolean
}

export interface IntegrationCatalogVariantItem {
  type: string
  label: string
  variantConfig?: IntegrationCatalogVariantConfigItem[] | null
}

export interface IntegrationCatalogItem {
  type: string
  name: string
  variants?: IntegrationCatalogVariantItem[] | null
}

export interface GeneratedToolEntry extends ToolData {
  scope?: 'read' | 'write' | 'admin'
  credentialVariants?: string[]
  toolset?: string
}

export interface GeneratedIntegrationEntry {
  manifest: Manifest
  prompt: string | null
  variants: CredentialVariantsFile | null
  hint: string | null
  hintsByVariant: Record<string, string>
  tools: GeneratedToolEntry[]
  variantOwnerType?: string | null
}
