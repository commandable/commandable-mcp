import { afterAll, beforeAll, describe, expect, it } from 'vitest'
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
  let buildWriteHandler: (name: string) => ((input: any) => Promise<any>)
  let buildDriveWrite: (name: string) => ((input: any) => Promise<any>)
  let folderId: string | undefined
  let documentId: string | undefined

  beforeAll(async () => {
    const credentialStore = {
      getCredentials: async () => ({
        token: env.GOOGLE_TOKEN || '',
        serviceAccountJson: env.GOOGLE_SERVICE_ACCOUNT_JSON || '',
      }),
    }

    const proxy = new IntegrationProxy({ credentialStore })
    const docsNode = {
      spaceId: 'ci',
      id: 'node-gdocs',
      referenceId: 'node-gdocs',
      type: 'google-docs',
      label: 'Google Docs',
      connectionMethod: 'credentials',
      credentialId: 'google-docs-creds',
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

    const tools = loadIntegrationTools('google-docs')
    expect(tools).toBeTruthy()

    const driveTools = loadIntegrationTools('google-drive')
    expect(driveTools).toBeTruthy()

    buildReadHandler = (name: string) => {
      const tool = tools!.read.find(t => t.name === name)
      expect(tool, `read tool ${name} exists`).toBeTruthy()
      const integration = { fetch: (path: string, init?: RequestInit) => proxy.call(docsNode, path, init) }
      const build = new Function('integration', `return (${tool!.handlerCode});`)
      return build(integration) as (input: any) => Promise<any>
    }

    buildWriteHandler = (name: string) => {
      const tool = tools!.write.find(t => t.name === name)
      expect(tool, `write tool ${name} exists`).toBeTruthy()
      const integration = { fetch: (path: string, init?: RequestInit) => proxy.call(docsNode, path, init) }
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

    // Create a dedicated folder + document for this test run, then clean up in afterAll.
    const create_folder = buildDriveWrite('create_folder')
    const folder = await create_folder({ name: `CmdTest Docs ${Date.now()}` })
    folderId = folder?.id
    expect(folderId).toBeTruthy()

    const create_document = buildWriteHandler('create_document')
    const doc = await create_document({ title: `CmdTest Doc ${Date.now()}` })
    documentId = doc?.documentId
    expect(documentId).toBeTruthy()

    const move_file = buildDriveWrite('move_file')
    await move_file({ fileId: documentId, addParents: folderId })
  }, 60000)

  afterAll(async () => {
    if (!folderId)
      return
    try {
      if (documentId) {
        const delete_file = buildDriveWrite('delete_file')
        await delete_file({ fileId: documentId })
      }
    }
    catch {}
    try {
      const delete_file = buildDriveWrite('delete_file')
      await delete_file({ fileId: folderId })
    }
    catch {}
  }, 60000)

  it('get_document returns metadata/content', async () => {
    if (!documentId)
      return expect(true).toBe(true)
    const handler = buildReadHandler('get_document')
    const result = await handler({ documentId })
    expect(result?.documentId || result?.body?.content || result?.title).toBeTruthy()
  }, 30000)

  it('get_document_text returns plain text', async () => {
    if (!documentId)
      return expect(true).toBe(true)
    const handler = buildReadHandler('get_document_text')
    const result = await handler({ documentId })
    expect(typeof result?.text === 'string').toBe(true)
  }, 30000)

  it('get_document_structured returns body JSON', async () => {
    if (!documentId)
      return expect(true).toBe(true)
    const handler = buildReadHandler('get_document_structured')
    const result = await handler({ documentId })
    expect(result?.body || result?.documentId).toBeTruthy()
  }, 30000)
})
