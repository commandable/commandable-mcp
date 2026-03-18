export interface CredentialFieldSchema {
  title?: string
  description?: string
}

export interface CredentialSchemaShape {
  properties?: Record<string, CredentialFieldSchema>
}

export interface CredentialVariantConfig {
  label: string
  credentialSchema: CredentialSchemaShape
  hintMarkdown?: string | null
}
