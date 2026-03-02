import { defineNitroPlugin } from 'nitropack/runtime'
import { getOrCreateEncryptionSecret } from '@commandable/mcp'

export default defineNitroPlugin(() => {
  // Enforce a single required secret for app + MCP runtime behavior.
  getOrCreateEncryptionSecret()
})
