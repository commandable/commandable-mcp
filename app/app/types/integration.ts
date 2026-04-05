import type {
  ToolsetMeta as IntegrationDataToolsetMeta,
  ToolListItem,
  ToolScope,
} from '@commandable/mcp-core'

export interface CatalogEntry {
  type: string
  name?: string
  variants?: CatalogVariantEntry[] | null
}

export interface CatalogVariantEntry {
  type: string
  label: string
  variantConfig?: VariantConfigEntry[] | null
}

export interface VariantConfigEntry {
  key: string
  label: string
  selectionMode: 'single' | 'multi'
  hasListHandler: boolean
}

export interface VariantOption {
  id: string
  name: string
}

export interface ToolsetEntry {
  key: string
}

export interface IntegrationToolsTreeExpose {
  toolsets?: ToolsetEntry[]
}

export type { ToolScope }

export type ToolItem = ToolListItem & {
  custom?: boolean
}

export type ToolsetMeta = IntegrationDataToolsetMeta & {
  key: string
}

export type ToolsetMap = Record<string, IntegrationDataToolsetMeta>

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
