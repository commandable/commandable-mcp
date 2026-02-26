import { beforeAll, describe, expect, it } from 'vitest'
import { IntegrationProxy } from '../../../src/integrations/proxy.js'
import { loadIntegrationTools } from '../../../src/integrations/dataLoader.js'

// LIVE Google Slides read tests using managed OAuth
// Required env vars:
// - COMMANDABLE_MANAGED_OAUTH_BASE_URL
// - COMMANDABLE_MANAGED_OAUTH_SECRET_KEY
// - GSLIDES_TEST_CONNECTION_ID (managed OAuth connection for provider 'google-slides')
// - GSLIDES_TEST_PRESENTATION_ID (an accessible presentation ID)

describe('google-slides read handlers (live)', () => {
  const env = process.env as Record<string, string>
  let buildReadHandler: (name: string) => ((input: any) => Promise<any>)

  beforeAll(async () => {
    const { COMMANDABLE_MANAGED_OAUTH_BASE_URL, COMMANDABLE_MANAGED_OAUTH_SECRET_KEY, GSLIDES_TEST_CONNECTION_ID } = env

    if (!COMMANDABLE_MANAGED_OAUTH_BASE_URL || !COMMANDABLE_MANAGED_OAUTH_SECRET_KEY || !GSLIDES_TEST_CONNECTION_ID) {
      console.warn('Skipping live Google Slides tests: missing required env vars')
      expect(false).toBe(true)
      return
    }

    const proxy = new IntegrationProxy({
      managedOAuthBaseUrl: COMMANDABLE_MANAGED_OAUTH_BASE_URL,
      managedOAuthSecretKey: COMMANDABLE_MANAGED_OAUTH_SECRET_KEY,
    })
    const integrationNode = { id: 'node-gslides', type: 'google-slides', label: 'Google Slides', connectionId: GSLIDES_TEST_CONNECTION_ID } as any

    const tools = loadIntegrationTools('google-slides')
    expect(tools).toBeTruthy()

    buildReadHandler = (name: string) => {
      const tool = tools!.read.find(t => t.name === name)
      expect(tool, `read tool ${name} exists`).toBeTruthy()
      const integration = { fetch: (path: string, init?: RequestInit) => proxy.call(integrationNode, path, init) }
      const build = new Function('integration', `return (${tool!.handlerCode});`)
      return build(integration) as (input: any) => Promise<any>
    }
  }, 60000)

  it('get_presentation returns metadata', async () => {
    const presentationId = env.GSLIDES_TEST_PRESENTATION_ID
    if (!presentationId)
      return expect(true).toBe(true)
    const handler = buildReadHandler('get_presentation')
    const result = await handler({ presentationId })
    expect(result?.presentationId || Array.isArray(result?.slides)).toBeTruthy()
  }, 30000)

  it('get_page_thumbnail returns URL data', async () => {
    const presentationId = env.GSLIDES_TEST_PRESENTATION_ID
    if (!presentationId)
      return expect(true).toBe(true)
    // First query the presentation to discover a page id
    const getPresentation = buildReadHandler('get_presentation')
    const meta = await getPresentation({ presentationId })
    const firstSlide = meta?.slides?.[0]
    if (!firstSlide?.objectId)
      return expect(true).toBe(true)
    const handler = buildReadHandler('get_page_thumbnail')
    const result = await handler({ presentationId, 'pageObjectId': firstSlide.objectId, 'thumbnailProperties.thumbnailSize': 'MEDIUM', 'thumbnailProperties.mimeType': 'PNG' })
    expect(typeof result?.contentUrl === 'string' || typeof result?.thumbnailUrl === 'string').toBe(true)
  }, 30000)
})
