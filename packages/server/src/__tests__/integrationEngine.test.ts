import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { createSafeHandlerFromString } from '../integrations/sandbox.js'
import { loadIntegrationTools } from '../integrations/dataLoader.js'
import { buildSandboxUtils } from '../integrations/sandboxUtils.js'

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

  it('injects sandbox utils (explicit bundles)', async () => {
    const utils = buildSandboxUtils(['html', 'adf'])
    const handler = createSafeHandlerFromString(
      `async (_input) => {
        const md = utils.htmlToMarkdown('<p>Hello</p>')
        const doc = utils.adf.fromMarkdown('# Title')
        return { md, docType: doc?.type, version: doc?.version }
      }`,
      () => ({}),
      utils,
    )
    const res = await handler({})
    expect(res.success).toBe(true)
    expect(String(res.result?.md)).toContain('Hello')
    expect(res.result?.docType).toBe('doc')
    expect(res.result?.version).toBe(1)
  })

  it('does not inject utils that were not requested', async () => {
    const utils = buildSandboxUtils([])
    const handler = createSafeHandlerFromString(
      `async (_input) => {
        return {
          hasHtml: typeof utils.htmlToMarkdown === 'function',
          hasAdf: typeof utils.adf === 'object',
        }
      }`,
      () => ({}),
      utils,
    )
    const res = await handler({})
    expect(res.success).toBe(true)
    expect(res.result?.hasHtml).toBe(false)
    expect(res.result?.hasAdf).toBe(false)
  })
})

