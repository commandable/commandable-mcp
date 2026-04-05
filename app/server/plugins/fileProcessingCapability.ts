import { warmFileProcessingCapability } from '@commandable/mcp-core'
import { defineNitroPlugin } from 'nitropack/runtime'

export default defineNitroPlugin(async () => {
  try {
    const capability = await warmFileProcessingCapability()
    if (!capability.enabled)
      process.stdout.write(`[commandable] file processing disabled: ${capability.reason || 'unknown'}\n`)
  }
  catch (error) {
    console.error('[commandable] failed to probe file processing capability')
    console.error(error)
  }
})
