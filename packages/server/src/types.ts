import type { JSONSchema7 } from 'json-schema'

export type IntegrationType =
  | 'jira'
  | 'airtable'
  | 'slack'
  | 'github'
  | 'notion'
  | 'trello'
  | 'http'
  | 'google-calendar'
  | 'google-sheet'
  | 'google-docs'
  | 'google-slides'
  | (string & {})

export interface IntegrationData {
  spaceId?: string
  id: string
  referenceId: string
  type: IntegrationType
  label: string
  enabled?: boolean
  config?: Record<string, any>
  enabledToolsets?: string[] | null
  /** Maximum scope tier allowed for this integration. null means no cap (all scopes). */
  maxScope?: 'read' | 'write' | null
  /** Individual tool names to block regardless of toolset or scope settings. */
  disabledTools?: string[] | null
  connectionId?: string | null
  connectionMethod?: 'managed' | 'credentials'
  credentialId?: string | null
  credentialVariant?: string | null
}

export interface ExecutableTool {
  name: string
  displayName: string
  description: string
  inputSchema: JSONSchema7
  integrations?: IntegrationData[]
  requireConfirmation?: boolean
  run: (args: any) => Promise<{ success: boolean, result: any, logs: string[] }>
}

