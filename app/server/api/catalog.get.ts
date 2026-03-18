import { listIntegrationCatalog, loadIntegrationCredentialConfig } from '@commandable/mcp-core'
import { defineEventHandler } from 'h3'

export default defineEventHandler(() => {
  const items = listIntegrationCatalog()
  return items.map((it) => {
    const cred = loadIntegrationCredentialConfig(it.type)
    return {
      ...it,
      supportsCredentials: !!cred,
      credentialSchema: cred?.schema ?? null,
    }
  })
})
