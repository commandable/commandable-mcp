export interface CatalogEntry {
  type: string
}

export interface ToolsetEntry {
  key: string
}

export interface IntegrationToolsTreeExpose {
  toolsets?: ToolsetEntry[]
}

export interface CredentialFieldSchema {
  title?: string
  description?: string
}

export interface CredentialSchemaShape {
  properties?: Record<string, CredentialFieldSchema>
}

export interface CredentialVariantConfig {
  key: string
  label: string
  schema: CredentialSchemaShape
  hintMarkdown: string | null
}
