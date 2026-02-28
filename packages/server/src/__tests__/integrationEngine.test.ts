import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { createSafeHandlerFromString } from '../integrations/sandbox.js'
import { loadIntegrationTools } from '../integrations/dataLoader.js'

const integrationDataDir = fileURLToPath(new URL('../../../integration-data/integrations', import.meta.url))

describe('integration engine ports', () => {
  it('loads integration tools from integration-data', () => {
    process.env.COMMANDABLE_INTEGRATION_DATA_DIR = integrationDataDir
    const loaded = loadIntegrationTools('github')
    expect(loaded).not.toBeNull()
    expect(loaded!.read.length + loaded!.write.length + loaded!.admin.length).toBeGreaterThan(0)
    expect(loaded!.read[0]!.handlerCode.length).toBeGreaterThan(0)
  })

  it('runs a sandboxed handler and captures logs', async () => {
    const handler = createSafeHandlerFromString(
      `async (input) => { console.log("hi", input.x); return input.x + 1 }`,
      () => ({}),
    )
    const res = await handler({ x: 1 })
    expect(res.success).toBe(true)
    expect(res.result).toBe(2)
    expect(res.logs.join('\\n')).toContain('hi')
  })
})

