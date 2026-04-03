import type { JSONSchema7 } from 'json-schema'

export interface CredentialVariantConfig {
  label: string
  schema: JSONSchema7
  baseUrlTemplate?: string
  injection: {
    headers?: Record<string, string>
    query?: Record<string, string>
  }
  preprocess?: string
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
  preprocess?: string
  healthCheck:
    | {
      path: string
      method?: string
    }
    | {
      notViable: true
    }
}

export interface ToolRef {
  name: string
  description: string
  inputSchema: string
  handler: string
  scope?: 'read' | 'write' | 'admin'
  credentialVariants?: string[]
  toolset?: string
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
}

export interface Manifest {
  name: string
  version?: string
  baseUrl?: string
  allowedOrigins?: string[]
  utils?: string[]
  toolsets?: Record<string, ToolsetMeta>
  tools: ToolRef[]
}

export interface IntegrationCatalogItem {
  type: string
  name: string
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
}
