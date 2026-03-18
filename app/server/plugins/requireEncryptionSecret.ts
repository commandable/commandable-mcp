import { getOrCreateEncryptionSecret } from '@commandable/mcp-core'
import { defineNitroPlugin } from 'nitropack/runtime'

export default defineNitroPlugin(() => {
  // Enforce a single required secret for app + MCP runtime behavior.
  getOrCreateEncryptionSecret()
})
