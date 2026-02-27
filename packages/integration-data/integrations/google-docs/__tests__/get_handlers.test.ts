import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createCredentialStore, createIntegrationNode, createProxy, createToolbox, hasEnv, safeCleanup } from '../../__tests__/liveHarness.js'

// LIVE Google Docs read tests using credentials (self-contained per run)
// Required env vars:
// - Either GOOGLE_TOKEN, OR GOOGLE_SERVICE_ACCOUNT_JSON

const suite = (hasEnv('GOOGLE_TOKEN') || hasEnv('GOOGLE_SERVICE_ACCOUNT_JSON'))
  ? describe
  : describe.skip

suite('google-docs read handlers (live)', () => {
  let docs: ReturnType<typeof createToolbox>
  let drive: ReturnType<typeof createToolbox>
  let folderId: string | undefined
  let documentId: string | undefined

  beforeAll(async () => {
    const env = process.env as Record<string, string | undefined>
    const credentialStore = createCredentialStore(async () => ({
      token: env.GOOGLE_TOKEN || '',
      serviceAccountJson: env.GOOGLE_SERVICE_ACCOUNT_JSON || '',
    }))
    const proxy = createProxy(credentialStore)
    docs = createToolbox('google-docs', proxy, createIntegrationNode('google-docs', { label: 'Google Docs', credentialId: 'google-docs-creds' }))
    drive = createToolbox('google-drive', proxy, createIntegrationNode('google-drive', { label: 'Google Drive', credentialId: 'google-drive-creds' }))

    // Create a dedicated folder + document for this test run, then clean up in afterAll.
    const folder = await drive.write('create_folder')({ name: `CmdTest Docs ${Date.now()}` })
    folderId = folder?.id
    expect(folderId).toBeTruthy()

    const created = await drive.write('create_file')({
      name: `CmdTest Doc ${Date.now()}`,
      mimeType: 'application/vnd.google-apps.document',
      parentId: folderId,
    })
    documentId = created?.id
    expect(documentId).toBeTruthy()
  }, 60000)

  afterAll(async () => {
    if (!folderId)
      return
    await safeCleanup(async () => documentId ? drive.write('delete_file')({ fileId: documentId }) : Promise.resolve())
    await safeCleanup(async () => drive.write('delete_file')({ fileId: folderId }))
  }, 60000)

  it('get_document returns metadata/content', async () => {
    if (!documentId)
      return expect(true).toBe(true)
    const handler = docs.read('get_document')
    const result = await handler({ documentId })
    expect(result?.documentId || result?.body?.content || result?.title).toBeTruthy()
  }, 30000)

  it('get_document_text returns plain text', async () => {
    if (!documentId)
      return expect(true).toBe(true)
    const handler = docs.read('get_document_text')
    const result = await handler({ documentId })
    expect(typeof result?.text === 'string').toBe(true)
  }, 30000)

  it('get_document_structured returns body JSON', async () => {
    if (!documentId)
      return expect(true).toBe(true)
    const handler = docs.read('get_document_structured')
    const result = await handler({ documentId })
    expect(result?.body || result?.documentId).toBeTruthy()
  }, 30000)
})
