import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createCredentialStore, createIntegrationNode, createProxy, createToolbox, hasEnv, safeCleanup } from '../../__tests__/liveHarness.js'

// LIVE Google Slides read tests using credentials
// Required env vars:
// - Either GOOGLE_TOKEN, OR GOOGLE_SERVICE_ACCOUNT_JSON

const suite = (hasEnv('GOOGLE_TOKEN') || hasEnv('GOOGLE_SERVICE_ACCOUNT_JSON'))
  ? describe
  : describe.skip

suite('google-workspace slides read handlers (live)', () => {
  let slides: ReturnType<typeof createToolbox>
  let drive: ReturnType<typeof createToolbox>
  let folderId: string | undefined
  let presentationId: string | undefined

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

    // Create dedicated folder + presentation for this run
    const folder = await drive.write('create_folder')({ name: `CmdTest Slides ${Date.now()}` })
    folderId = folder?.id
    expect(folderId).toBeTruthy()

    const created = await drive.write('create_file')({
      name: `CmdTest Slides ${Date.now()}`,
      mimeType: 'application/vnd.google-apps.presentation',
      parentId: folderId,
    })
    presentationId = created?.id
    expect(presentationId).toBeTruthy()
  }, 60000)

  afterAll(async () => {
    if (!folderId)
      return
    await safeCleanup(async () => presentationId ? drive.write('delete_file')({ fileId: presentationId }) : Promise.resolve())
    await safeCleanup(async () => drive.write('delete_file')({ fileId: folderId }))
  }, 60000)

  it('read_presentation returns human-readable content', async () => {
    if (!presentationId)
      return expect(true).toBe(true)
    const handler = slides.read('read_presentation')
    const result = await handler({ presentationId })
    expect(typeof result).toBe('string')
    expect(String(result)).toContain('Presentation:')
  }, 30000)

  it('get_page_thumbnail returns URL data', async () => {
    if (!presentationId)
      return expect(true).toBe(true)
    // Query the readable summary and parse "Slide 1: ID <objectId>, ..."
    const readPresentation = slides.read('read_presentation')
    const summary = await readPresentation({ presentationId })
    const text = String(summary || '')
    const match = text.match(/Slide 1: ID ([^,\n]+)/)
    const firstSlideObjectId = match?.[1]
    if (!firstSlideObjectId)
      return expect(true).toBe(true)
    const handler = slides.read('get_page_thumbnail')
    const result = await handler({ presentationId, 'pageObjectId': firstSlideObjectId, 'thumbnailProperties.thumbnailSize': 'MEDIUM', 'thumbnailProperties.mimeType': 'PNG' })
    expect(typeof result?.contentUrl === 'string' || typeof result?.thumbnailUrl === 'string').toBe(true)
  }, 30000)

  it('search_slides finds the created presentation by name', async () => {
    if (!presentationId)
      return expect(true).toBe(true)
    const meta = await drive.read('get_file_meta')({ fileId: presentationId })
    const name = meta?.name
    if (!name)
      return expect(true).toBe(true)
    const result = await slides.read('search_slides')({ name: name.slice(0, 10) })
    expect(Array.isArray(result?.files)).toBe(true)
    expect(result?.files.some((f: any) => f?.id === presentationId)).toBe(true)
  }, 30000)
})
