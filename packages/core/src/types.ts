import type { JSONSchema7 } from 'json-schema'

export type IntegrationType =
  | 'jira'
  | 'airtable'
  | 'slack'
  | 'github'
  | 'notion'
  | 'trello'
  | 'google-calendar'
  | 'google-workspace'
  | 'sharepoint'
  | (string & {})

export interface IntegrationData {
  spaceId?: string
  id: string
  referenceId: string
  type: IntegrationType
  label: string
  config?: Record<string, unknown> | null
  enabled?: boolean
  enabledToolsets?: string[] | null
  /** Maximum scope tier allowed for this integration. null means no cap (all scopes). */
  maxScope?: 'read' | 'write' | null
  /** Individual tool names to block regardless of toolset or scope settings. */
  disabledTools?: string[] | null
  connectionId?: string | null
  connectionMethod?: 'managed' | 'credentials'
  credentialId?: string | null
  credentialVariant?: string | null
  healthStatus?: 'disconnected' | 'connected' | 'invalid_credentials' | null
  healthCheckedAt?: Date | null
}

export interface ToolRunResult {
  success: boolean
  result: any
  logs: string[]
}

export interface ExecutableTool {
  name: string
  displayName: string
  description: string
  inputSchema: JSONSchema7
  integrations?: IntegrationData[]
  requireConfirmation?: boolean
  run: (args: any) => Promise<ToolRunResult>
}

export type ToolScope = 'read' | 'write' | 'admin'

export interface ToolDefinition {
  /** Optional for built-in tools; required for DB persisted tool definitions. */
  id?: string
  spaceId?: string
  integrationId?: string
  name: string
  displayName?: string | null
  description: string
  scope: ToolScope
  inputSchema: JSONSchema7
  handlerCode: string
  utils?: string[] | null
  createdAt?: Date
  updatedAt?: Date
}

export type IntegrationAuth =
  | { kind: 'template', injection: { headers?: Record<string, string>, query?: Record<string, string> } }
  | { kind: 'basic', usernameField: string, passwordField: string }

export type IntegrationCredentialPreprocess =
  | 'google_service_account'
  | {
    type: 'handler'
    handlerCode: string
    allowedOrigins?: string[] | null
  }

export interface IntegrationCredentialVariant {
  label: string
  credentialSchema: JSONSchema7
  auth: IntegrationAuth
  /** Fixed base URL for API requests. */
  baseUrl?: string | null
  /** Template for constructing the base URL from credential fields, e.g. "https://{{domain}}.atlassian.net". */
  baseUrlTemplate?: string | null
  /** Explicit absolute origins/wildcards the integration may call with injected credentials. */
  allowedOrigins?: string[] | null
  healthCheck?: { path: string, method?: string } | { notViable: true } | null
  hintMarkdown?: string | null
  /** Credential transforms that require async work before request injection.
   *  Use 'google_service_account' for the built-in JWT-signing flow, or a sandboxed
   *  handler preprocess for declarative integration-data auth steps like OAuth token exchange. */
  preprocess?: IntegrationCredentialPreprocess | null
}

export interface IntegrationTypeConfig {
  /** Only set for DB-persisted configs. */
  id?: string
  /** Only set for DB-persisted configs. */
  spaceId?: string
  typeSlug: string
  label: string
  defaultVariant: string
  variants: Record<string, IntegrationCredentialVariant>
  createdAt?: Date
  updatedAt?: Date
}

