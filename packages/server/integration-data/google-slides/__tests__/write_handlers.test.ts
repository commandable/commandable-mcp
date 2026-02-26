import { $fetch } from 'ofetch'
import { beforeAll, describe, expect, it } from 'vitest'
import { IntegrationProxy } from '../../../../server/services/integrationProxy'
import { loadIntegrationTools } from '../../../../server/utils/integrationDataLoader'

// LIVE Google Slides write tests using Nango
// Required env vars:
// - NUXT_PUBLIC_NANGO_API_BASE_URL
// - NUXT_NANGO_SECRET_KEY
// - GSLIDES_TEST_CONNECTION_ID (Nango connection for provider 'google-slides')
// - GSLIDES_TEST_PRESENTATION_ID (a presentation ID with write access)

interface Ctx { presentationId?: string }

describe('google-slides write handlers (live)', () => {
  const env = process.env as Record<string, string>
  const ctx: Ctx = {}
  let buildWriteHandler: (name: string) => ((input: any) => Promise<any>)

  beforeAll(async () => {
    const { NUXT_PUBLIC_NANGO_API_BASE_URL, NUXT_NANGO_SECRET_KEY, GSLIDES_TEST_CONNECTION_ID, GSLIDES_TEST_PRESENTATION_ID } = env

    if (!NUXT_PUBLIC_NANGO_API_BASE_URL || !NUXT_NANGO_SECRET_KEY || !GSLIDES_TEST_CONNECTION_ID) {
      console.warn('Skipping live Google Slides write tests: missing required env vars')
      expect(false).toBe(true)
      return
    }

    ;(global as any).$fetch = $fetch
    ;(global as any).useRuntimeConfig = () => ({ public: { nangoApiBaseUrl: NUXT_PUBLIC_NANGO_API_BASE_URL } })

    const proxy = new IntegrationProxy(NUXT_NANGO_SECRET_KEY)
    const integrationNode = { id: 'node-gslides', type: 'google-slides', label: 'Google Slides', connectionId: GSLIDES_TEST_CONNECTION_ID } as any

    const tools = loadIntegrationTools('google-slides')
    expect(tools).toBeTruthy()

    buildWriteHandler = (name: string) => {
      const tool = tools!.write.find(t => t.name === name)
      expect(tool, `write tool ${name} exists`).toBeTruthy()
      const integration = { fetch: (path: string, init?: RequestInit) => proxy.call(integrationNode, path, init) }
      const build = new Function('integration', `return (${tool!.handlerCode});`)
      return build(integration) as (input: any) => Promise<any>
    }

    ctx.presentationId = GSLIDES_TEST_PRESENTATION_ID
  }, 60000)

  it('batch_update performs a trivial update (no-op replace)', async () => {
    if (!ctx.presentationId)
      return expect(true).toBe(true)
    const handler = buildWriteHandler('batch_update')
    const res = await handler({ presentationId: ctx.presentationId, requests: [
      { replaceAllText: { containsText: { text: '___unlikely___', matchCase: true }, replaceText: '___unlikely___' } },
    ] })
    expect(res?.presentationId || Array.isArray(res?.replies) || res?.writeControl).toBeTruthy()
  }, 60000)

  it('create_presentation creates a presentation when allowed', async () => {
    if (!env.GSLIDES_ALLOW_CREATE)
      return expect(true).toBe(true)
    const handler = buildWriteHandler('create_presentation')
    const res = await handler({ title: `Cmd Slides ${Date.now()}` })
    expect(typeof res?.presentationId === 'string').toBe(true)
  }, 60000)

  it('append_text_to_title_of_slide_index appends to title', async () => {
    if (!ctx.presentationId)
      return expect(true).toBe(true)
    const handler = buildWriteHandler('append_text_to_title_of_slide_index')
    const res = await handler({ presentationId: ctx.presentationId, slideIndex: 0, text: ` CmdTest ${Date.now()}` })
    expect(res?.presentationId || Array.isArray(res?.replies)).toBeTruthy()
  }, 60000)

  it('replace_text_first_match replaces text (no-op ok)', async () => {
    if (!ctx.presentationId)
      return expect(true).toBe(true)
    const handler = buildWriteHandler('replace_text_first_match')
    const res = await handler({ presentationId: ctx.presentationId, findText: '___unlikely___', replaceText: '___unlikely___' })
    expect(res?.presentationId || Array.isArray(res?.replies)).toBeTruthy()
  }, 60000)

  it('style_text_first_match applies style', async () => {
    if (!ctx.presentationId)
      return expect(true).toBe(true)
    const handler = buildWriteHandler('style_text_first_match')
    const res = await handler({ presentationId: ctx.presentationId, findText: 'the', textStyle: { bold: true } })
    expect(res?.presentationId || Array.isArray(res?.replies)).toBeTruthy()
  }, 60000)

  it('insert_shape_after_first_match inserts a shape', async () => {
    if (!ctx.presentationId)
      return expect(true).toBe(true)
    const handler = buildWriteHandler('insert_shape_after_first_match')
    const res = await handler({ presentationId: ctx.presentationId, findText: 'the', shapeType: 'RECTANGLE' })
    expect(res?.presentationId || Array.isArray(res?.replies)).toBeTruthy()
  }, 60000)

  it('insert_image_after_first_match inserts an image when allowed', async () => {
    if (!ctx.presentationId || !env.GSLIDES_TEST_IMAGE_URI)
      return expect(true).toBe(true)
    const handler = buildWriteHandler('insert_image_after_first_match')
    const res = await handler({ presentationId: ctx.presentationId, findText: 'the', uri: env.GSLIDES_TEST_IMAGE_URI })
    expect(res?.presentationId || Array.isArray(res?.replies)).toBeTruthy()
  }, 60000)

  it('create_slide_after_first_match creates a slide near anchor', async () => {
    if (!ctx.presentationId)
      return expect(true).toBe(true)
    const handler = buildWriteHandler('create_slide_after_first_match')
    const res = await handler({ presentationId: ctx.presentationId, findText: 'the', layout: 'BLANK' })
    expect(res?.presentationId || Array.isArray(res?.replies)).toBeTruthy()
  }, 60000)

  it('set_background_color_for_slide_index sets color', async () => {
    if (!ctx.presentationId)
      return expect(true).toBe(true)
    const handler = buildWriteHandler('set_background_color_for_slide_index')
    const res = await handler({ presentationId: ctx.presentationId, slideIndex: 0, rgbColor: { red: 0.9, green: 0.9, blue: 0.9 } })
    expect(res?.presentationId || Array.isArray(res?.replies)).toBeTruthy()
  }, 60000)
})
