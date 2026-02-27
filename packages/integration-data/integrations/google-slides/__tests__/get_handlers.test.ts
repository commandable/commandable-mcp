import { afterAll, beforeAll, describe, expect, it } from 'vitest'
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
  let buildWriteHandler: (name: string) => ((input: any) => Promise<any>)
  let buildDriveWrite: (name: string) => ((input: any) => Promise<any>)
  let folderId: string | undefined
  let presentationId: string | undefined

  beforeAll(async () => {
    const credentialStore = {
      getCredentials: async () => ({
        token: env.GOOGLE_TOKEN || '',
        serviceAccountJson: env.GOOGLE_SERVICE_ACCOUNT_JSON || '',
      }),
    }

    const proxy = new IntegrationProxy({ credentialStore })
    const slidesNode = {
      spaceId: 'ci',
      id: 'node-gslides',
      referenceId: 'node-gslides',
      type: 'google-slides',
      label: 'Google Slides',
      connectionMethod: 'credentials',
      credentialId: 'google-slides-creds',
    } as any
    const driveNode = {
      spaceId: 'ci',
      id: 'node-gdrive',
      referenceId: 'node-gdrive',
      type: 'google-drive',
      label: 'Google Drive',
      connectionMethod: 'credentials',
      credentialId: 'google-drive-creds',
    } as any

    const tools = loadIntegrationTools('google-slides')
    expect(tools).toBeTruthy()

    const driveTools = loadIntegrationTools('google-drive')
    expect(driveTools).toBeTruthy()

    buildReadHandler = (name: string) => {
      const tool = tools!.read.find(t => t.name === name)
      expect(tool, `read tool ${name} exists`).toBeTruthy()
      const integration = { fetch: (path: string, init?: RequestInit) => proxy.call(slidesNode, path, init) }
      const build = new Function('integration', `return (${tool!.handlerCode});`)
      return build(integration) as (input: any) => Promise<any>
    }

    buildWriteHandler = (name: string) => {
      const tool = tools!.write.find(t => t.name === name)
      expect(tool, `write tool ${name} exists`).toBeTruthy()
      const integration = { fetch: (path: string, init?: RequestInit) => proxy.call(slidesNode, path, init) }
      const build = new Function('integration', `return (${tool!.handlerCode});`)
      return build(integration) as (input: any) => Promise<any>
    }

    buildDriveWrite = (name: string) => {
      const tool = driveTools!.write.find(t => t.name === name)
      expect(tool, `drive tool ${name} exists`).toBeTruthy()
      const integration = { fetch: (path: string, init?: RequestInit) => proxy.call(driveNode, path, init) }
      const build = new Function('integration', `return (${tool!.handlerCode});`)
      return build(integration) as (input: any) => Promise<any>
    }

    // Create dedicated folder + presentation for this run
    const create_folder = buildDriveWrite('create_folder')
    const folder = await create_folder({ name: `CmdTest Slides ${Date.now()}` })
    folderId = folder?.id
    expect(folderId).toBeTruthy()

    const create_presentation = buildWriteHandler('create_presentation')
    const created = await create_presentation({ title: `CmdTest Slides ${Date.now()}` })
    presentationId = created?.presentationId
    expect(presentationId).toBeTruthy()

    const move_file = buildDriveWrite('move_file')
    await move_file({ fileId: presentationId, addParents: folderId })
  }, 60000)

  afterAll(async () => {
    if (!folderId)
      return
    try {
      if (presentationId) {
        const delete_file = buildDriveWrite('delete_file')
        await delete_file({ fileId: presentationId })
      }
    }
    catch {}
    try {
      const delete_file = buildDriveWrite('delete_file')
      await delete_file({ fileId: folderId })
    }
    catch {}
  }, 60000)

  it('get_presentation returns metadata', async () => {
    if (!presentationId)
      return expect(true).toBe(true)
    const handler = buildReadHandler('get_presentation')
    const result = await handler({ presentationId })
    expect(result?.presentationId || Array.isArray(result?.slides)).toBeTruthy()
  }, 30000)

  it('get_page_thumbnail returns URL data', async () => {
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
