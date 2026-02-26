import { $fetch } from 'ofetch'
import { beforeAll, describe, expect, it } from 'vitest'
import { IntegrationProxy } from '../../../../server/services/integrationProxy'
import { loadIntegrationTools } from '../../../../server/utils/integrationDataLoader'

// LIVE Google Docs read tests using Nango
// Required env vars:
// - NUXT_PUBLIC_NANGO_API_BASE_URL
// - NUXT_NANGO_SECRET_KEY
// - GDOCS_TEST_CONNECTION_ID (Nango connection for provider 'google-docs')
// - GDOCS_TEST_DOCUMENT_ID (an accessible document ID)

describe('google-docs read handlers (live)', () => {
  const env = process.env as Record<string, string>
  let buildReadHandler: (name: string) => ((input: any) => Promise<any>)

  beforeAll(async () => {
    const { NUXT_PUBLIC_NANGO_API_BASE_URL, NUXT_NANGO_SECRET_KEY, GDOCS_TEST_CONNECTION_ID } = env

    if (!NUXT_PUBLIC_NANGO_API_BASE_URL || !NUXT_NANGO_SECRET_KEY || !GDOCS_TEST_CONNECTION_ID) {
      console.warn('Skipping live Google Docs tests: missing required env vars')
      expect(false).toBe(true)
      return
    }

    ;(global as any).$fetch = $fetch
    ;(global as any).useRuntimeConfig = () => ({ public: { nangoApiBaseUrl: NUXT_PUBLIC_NANGO_API_BASE_URL } })

    const proxy = new IntegrationProxy(NUXT_NANGO_SECRET_KEY)
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
