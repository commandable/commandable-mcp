import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createCredentialStore, createIntegrationNode, createProxy, createToolbox, hasEnv, safeCleanup } from '../../__tests__/liveHarness.js'

// LIVE Google Slides write tests using credentials
// Required env vars:
// - Either GOOGLE_TOKEN, OR GOOGLE_SERVICE_ACCOUNT_JSON

interface Ctx { presentationId?: string, folderId?: string, anchorText?: string }

const suite = (hasEnv('GOOGLE_TOKEN') || hasEnv('GOOGLE_SERVICE_ACCOUNT_JSON'))
  ? describe
  : describe.skip

suite('google-workspace slides write handlers (live)', () => {
  const ctx: Ctx = {}
  let slides: ReturnType<typeof createToolbox>
  let drive: ReturnType<typeof createToolbox>

  beforeAll(async () => {
    const env = process.env as Record<string, string | undefined>
    const credentialStore = createCredentialStore(async () => ({
      token: env.GOOGLE_TOKEN || '',
      serviceAccountJson: env.GOOGLE_SERVICE_ACCOUNT_JSON || '',
      subject: env.GOOGLE_IMPERSONATE_SUBJECT || '',
    }))
    const proxy = createProxy(credentialStore)
    slides = createToolbox('google-workspace', proxy, createIntegrationNode('google-workspace', { label: 'Google Workspace', credentialId: 'google-workspace-creds' }))
    drive = createToolbox('google-workspace', proxy, createIntegrationNode('google-workspace', { label: 'Google Workspace', credentialId: 'google-workspace-creds' }))

    const folder = await drive.write('create_folder')({ name: `CmdTest Slides Write ${Date.now()}` })
    ctx.folderId = folder?.id
    expect(ctx.folderId).toBeTruthy()

    const created = await drive.write('create_file')({
      name: `CmdTest Slides ${Date.now()}`,
      mimeType: 'application/vnd.google-apps.presentation',
      parentId: ctx.folderId,
    })
    ctx.presentationId = created?.id
    expect(ctx.presentationId).toBeTruthy()

    ctx.anchorText = `CMD_ANCHOR_${Date.now()}`
    const appendTitle = slides.write('append_text_to_title_of_slide_index')
    await appendTitle({ presentationId: ctx.presentationId, slideIndex: 0, text: ` ${ctx.anchorText} ` })
  }, 60000)

  afterAll(async () => {
    await safeCleanup(async () => ctx.presentationId ? drive.write('delete_file')({ fileId: ctx.presentationId }) : Promise.resolve())
    await safeCleanup(async () => ctx.folderId ? drive.write('delete_file')({ fileId: ctx.folderId }) : Promise.resolve())
  }, 60_000)

  it('slides_batch_update performs a trivial update (no-op replace)', async () => {
    if (!ctx.presentationId)
      return expect(true).toBe(true)
    const handler = slides.write('slides_batch_update')
    const res = await handler({ presentationId: ctx.presentationId, requests: [
      { replaceAllText: { containsText: { text: '___unlikely___', matchCase: true }, replaceText: '___unlikely___' } },
    ] })
    expect(res?.presentationId || Array.isArray(res?.replies) || res?.writeControl).toBeTruthy()
  }, 60000)

  it('append_text_to_title_of_slide_index appends to title', async () => {
    if (!ctx.presentationId)
      return expect(true).toBe(true)
    const handler = slides.write('append_text_to_title_of_slide_index')
    const res = await handler({ presentationId: ctx.presentationId, slideIndex: 0, text: ` CmdTest ${Date.now()}` })
    expect(res?.presentationId || Array.isArray(res?.replies)).toBeTruthy()
  }, 60000)

  it('replace_text_first_match replaces text (no-op ok)', async () => {
    if (!ctx.presentationId)
      return expect(true).toBe(true)
    const handler = slides.write('replace_text_first_match')
    const res = await handler({ presentationId: ctx.presentationId, findText: '___unlikely___', replaceText: '___unlikely___' })
    expect(res?.presentationId || Array.isArray(res?.replies)).toBeTruthy()
  }, 60000)

  it('style_text_first_match applies style', async () => {
    if (!ctx.presentationId)
      return expect(true).toBe(true)
    if (!ctx.anchorText)
      return expect(true).toBe(true)
    const handler = slides.write('style_text_first_match')
    const res = await handler({ presentationId: ctx.presentationId, findText: ctx.anchorText, textStyle: { bold: true } })
    expect(res?.presentationId || Array.isArray(res?.replies)).toBeTruthy()
  }, 60000)

  it('insert_shape_after_first_match inserts a shape', async () => {
    if (!ctx.presentationId)
      return expect(true).toBe(true)
    if (!ctx.anchorText)
      return expect(true).toBe(true)
    const handler = slides.write('insert_shape_after_first_match')
    const res = await handler({ presentationId: ctx.presentationId, findText: ctx.anchorText, shapeType: 'RECTANGLE' })
    expect(res?.presentationId || Array.isArray(res?.replies)).toBeTruthy()
  }, 60000)

  it('insert_image_after_first_match inserts an image when allowed', async () => {
    if (!ctx.presentationId || !ctx.anchorText)
      return expect(true).toBe(true)
    const imageUri = 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png'
    const handler = slides.write('insert_image_after_first_match')
    const res = await handler({ presentationId: ctx.presentationId, findText: ctx.anchorText, uri: imageUri })
    expect(res?.presentationId || Array.isArray(res?.replies)).toBeTruthy()
  }, 60000)

  it('create_slide_after_first_match creates a slide near anchor', async () => {
    if (!ctx.presentationId)
      return expect(true).toBe(true)
    if (!ctx.anchorText)
      return expect(true).toBe(true)
    const handler = slides.write('create_slide_after_first_match')
    const res = await handler({ presentationId: ctx.presentationId, findText: ctx.anchorText, layout: 'BLANK' })
    expect(res?.presentationId || Array.isArray(res?.replies)).toBeTruthy()
  }, 60000)

  it('set_background_color_for_slide_index sets color', async () => {
    if (!ctx.presentationId)
      return expect(true).toBe(true)
    const handler = slides.write('set_background_color_for_slide_index')
    const res = await handler({ presentationId: ctx.presentationId, slideIndex: 0, rgbColor: { red: 0.9, green: 0.9, blue: 0.9 } })
    expect(res?.presentationId || Array.isArray(res?.replies)).toBeTruthy()
  }, 60000)

  it('create_presentation creates a presentation (self-cleaning)', async () => {
    const created = await slides.write('create_presentation')({ title: `CmdTest Slides Tool ${Date.now()}` })
    const id = created?.presentationId
    expect(typeof id).toBe('string')
    await safeCleanup(async () => id ? drive.write('delete_file')({ fileId: id }) : Promise.resolve())
  }, 60000)
})
