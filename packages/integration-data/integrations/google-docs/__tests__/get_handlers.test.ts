import { beforeAll, describe, expect, it } from 'vitest'
import { IntegrationProxy } from '../../../../server/src/integrations/proxy.js'
import { loadIntegrationTools } from '../../../../server/src/integrations/dataLoader.js'

// LIVE Google Docs read tests using credentials
// Required env vars:
// - Either GOOGLE_TOKEN, OR GOOGLE_SERVICE_ACCOUNT_JSON
// - GOOGLE_DOCS_TEST_DOCUMENT_ID (an accessible document ID)

const env = process.env as Record<string, string>
const hasEnv = (...keys: string[]) => keys.every(k => !!env[k] && env[k].trim().length > 0)
const suite = (hasEnv('GOOGLE_TOKEN') || hasEnv('GOOGLE_SERVICE_ACCOUNT_JSON'))
  ? describe
  : describe.skip

suite('google-docs read handlers (live)', () => {
  let buildReadHandler: (name: string) => ((input: any) => Promise<any>)

  beforeAll(async () => {
    const credentialStore = {
      getCredentials: async () => ({
        token: env.GOOGLE_TOKEN || '',
        serviceAccountJson: env.GOOGLE_SERVICE_ACCOUNT_JSON || '',
      }),
    }

    const proxy = new IntegrationProxy({ credentialStore })
    const integrationNode = {
      spaceId: 'ci',
      id: 'node-gdocs',
      referenceId: 'node-gdocs',
      type: 'google-docs',
      label: 'Google Docs',
      connectionMethod: 'credentials',
      credentialId: 'google-docs-creds',
    } as any

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
    const documentId = env.GOOGLE_DOCS_TEST_DOCUMENT_ID || env.GDOCS_TEST_DOCUMENT_ID
    if (!documentId)
      return expect(true).toBe(true)
    const handler = buildReadHandler('get_document')
    const result = await handler({ documentId })
    expect(result?.documentId || result?.body?.content || result?.title).toBeTruthy()
  }, 30000)

  it('get_document_text returns plain text', async () => {
    const documentId = env.GOOGLE_DOCS_TEST_DOCUMENT_ID || env.GDOCS_TEST_DOCUMENT_ID
    if (!documentId)
      return expect(true).toBe(true)
    const handler = buildReadHandler('get_document_text')
    const result = await handler({ documentId })
    expect(typeof result?.text === 'string').toBe(true)
  }, 30000)

  it('get_document_structured returns body JSON', async () => {
    const documentId = env.GOOGLE_DOCS_TEST_DOCUMENT_ID || env.GDOCS_TEST_DOCUMENT_ID
    if (!documentId)
      return expect(true).toBe(true)
    const handler = buildReadHandler('get_document_structured')
    const result = await handler({ documentId })
    expect(result?.body || result?.documentId).toBeTruthy()
  }, 30000)
})
