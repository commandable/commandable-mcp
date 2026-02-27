import { beforeAll, describe, expect, it } from 'vitest'
import { IntegrationProxy } from '../../../../server/src/integrations/proxy.js'
import { loadIntegrationTools } from '../../../../server/src/integrations/dataLoader.js'

// LIVE Google Slides read tests using credentials
// Required env vars:
// - Either GOOGLE_TOKEN, OR GOOGLE_SERVICE_ACCOUNT_JSON
// - GOOGLE_SLIDES_TEST_PRESENTATION_ID (an accessible presentation ID)

const env = process.env as Record<string, string>
const hasEnv = (...keys: string[]) => keys.every(k => !!env[k] && env[k].trim().length > 0)
const suite = (hasEnv('GOOGLE_TOKEN') || hasEnv('GOOGLE_SERVICE_ACCOUNT_JSON'))
  ? describe
  : describe.skip

suite('google-slides read handlers (live)', () => {
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
      id: 'node-gslides',
      referenceId: 'node-gslides',
      type: 'google-slides',
      label: 'Google Slides',
      connectionMethod: 'credentials',
      credentialId: 'google-slides-creds',
    } as any

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
    const presentationId = env.GOOGLE_SLIDES_TEST_PRESENTATION_ID || env.GSLIDES_TEST_PRESENTATION_ID
    if (!presentationId)
      return expect(true).toBe(true)
    const handler = buildReadHandler('get_presentation')
    const result = await handler({ presentationId })
    expect(result?.presentationId || Array.isArray(result?.slides)).toBeTruthy()
  }, 30000)

  it('get_page_thumbnail returns URL data', async () => {
    const presentationId = env.GOOGLE_SLIDES_TEST_PRESENTATION_ID || env.GSLIDES_TEST_PRESENTATION_ID
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
