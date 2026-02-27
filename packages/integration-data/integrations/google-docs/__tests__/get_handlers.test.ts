import { beforeAll, describe, expect, it } from 'vitest'
import { IntegrationProxy } from '../../../src/integrations/proxy.js'
import { loadIntegrationTools } from '../../../src/integrations/dataLoader.js'

// LIVE Google Docs read tests using managed OAuth
// Required env vars:
// - COMMANDABLE_MANAGED_OAUTH_BASE_URL
// - COMMANDABLE_MANAGED_OAUTH_SECRET_KEY
// - GDOCS_TEST_CONNECTION_ID (managed OAuth connection for provider 'google-docs')
// - GDOCS_TEST_DOCUMENT_ID (an accessible document ID)

const env = process.env as Record<string, string>
const hasEnv = (...keys: string[]) => keys.every(k => !!env[k] && env[k].trim().length > 0)
const suite = hasEnv(
  'COMMANDABLE_MANAGED_OAUTH_BASE_URL',
  'COMMANDABLE_MANAGED_OAUTH_SECRET_KEY',
  'GDOCS_TEST_CONNECTION_ID',
)
  ? describe
  : describe.skip

suite('google-docs read handlers (live)', () => {
  let buildReadHandler: (name: string) => ((input: any) => Promise<any>)

  beforeAll(async () => {
    const { COMMANDABLE_MANAGED_OAUTH_BASE_URL, COMMANDABLE_MANAGED_OAUTH_SECRET_KEY, GDOCS_TEST_CONNECTION_ID } = env

    const proxy = new IntegrationProxy({
      managedOAuthBaseUrl: COMMANDABLE_MANAGED_OAUTH_BASE_URL,
      managedOAuthSecretKey: COMMANDABLE_MANAGED_OAUTH_SECRET_KEY,
    })
    const integrationNode = { id: 'node-gdocs', type: 'google-docs', label: 'Google Docs', connectionId: GDOCS_TEST_CONNECTION_ID } as any

    const tools = loadIntegrationTools('google-docs')
    expect(tools).toBeTruthy()

    buildReadHandler = (name: string) => {
      const tool = tools!.read.find(t => t.name === name)
      expect(tool, `read tool ${name} exists`).toBeTruthy()
      const integration = { fetch: (path: string, init?: RequestInit) => proxy.call(integrationNode, path, init) }
      const build = new Function('integration', `return (${tool!.handlerCode});`)
      return build(integration) as (input: any) => Promise<any>
    }
  }, 60000)

  it('get_document returns metadata/content', async () => {
    const documentId = env.GDOCS_TEST_DOCUMENT_ID
    if (!documentId)
      return expect(true).toBe(true)
    const handler = buildReadHandler('get_document')
    const result = await handler({ documentId })
    expect(result?.documentId || result?.body?.content || result?.title).toBeTruthy()
  }, 30000)

  it('get_document_text returns plain text', async () => {
    const documentId = env.GDOCS_TEST_DOCUMENT_ID
    if (!documentId)
      return expect(true).toBe(true)
    const handler = buildReadHandler('get_document_text')
    const result = await handler({ documentId })
    expect(typeof result?.text === 'string').toBe(true)
  }, 30000)

  it('get_document_structured returns body JSON', async () => {
    const documentId = env.GDOCS_TEST_DOCUMENT_ID
    if (!documentId)
      return expect(true).toBe(true)
    const handler = buildReadHandler('get_document_structured')
    const result = await handler({ documentId })
    expect(result?.body || result?.documentId).toBeTruthy()
  }, 30000)
})
