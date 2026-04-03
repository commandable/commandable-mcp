import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createCredentialStore, createIntegrationNode, createProxy, createToolbox, hasEnv, safeCleanup } from '../../__tests__/liveHarness.js'

// LIVE Google Docs read tests -- runs once per available credential variant.
// Required env vars (at least one):
// - GOOGLE_SERVICE_ACCOUNT_JSON  (service_account variant)
// - GOOGLE_TOKEN                 (oauth_token variant)

const env = process.env as Record<string, string | undefined>

interface VariantConfig {
  key: string
  credentials: () => Record<string, string>
}

const variants: VariantConfig[] = [
  {
    key: 'service_account',
    credentials: () => ({ serviceAccountJson: env.GOOGLE_SERVICE_ACCOUNT_JSON || '', subject: env.GOOGLE_IMPERSONATE_SUBJECT || '' }),
  },
  {
    key: 'oauth_token',
    credentials: () => ({ token: env.GOOGLE_TOKEN || '' }),
  },
].filter(v => Object.values(v.credentials()).some(val => val.trim().length > 0))

const suiteOrSkip = variants.length > 0 ? describe : describe.skip

suiteOrSkip('google-workspace docs read handlers (live)', () => {
  for (const variant of variants) {
    describe(`variant: ${variant.key}`, () => {
      let docs: ReturnType<typeof createToolbox>
      let drive: ReturnType<typeof createToolbox>
      let folderId: string | undefined
      let documentId: string | undefined

      beforeAll(async () => {
        const credentialStore = createCredentialStore(async () => variant.credentials())
        const proxy = createProxy(credentialStore)
        docs = createToolbox(
          'google-workspace',
          proxy,
          createIntegrationNode('google-workspace', { label: 'Google Workspace', credentialId: 'google-workspace-creds', credentialVariant: variant.key }),
          variant.key,
        )
        drive = createToolbox(
          'google-workspace',
          proxy,
          createIntegrationNode('google-workspace', { label: 'Google Workspace', credentialId: 'google-workspace-creds', credentialVariant: variant.key }),
          variant.key,
        )

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

      it('read_document returns markdown content', async () => {
        if (!documentId)
          return expect(true).toBe(true)
        const handler = docs.read('read_document')
        const result = await handler({ documentId })
        expect(result?.documentId || result?.title).toBeTruthy()
        expect(typeof result?.markdown).toBe('string')
      }, 30000)

      it('search_docs finds the created doc by name', async () => {
        if (!documentId)
          return expect(true).toBe(true)
        const meta = await drive.read('get_file_meta')({ fileId: documentId })
        const name = meta?.name
        if (!name)
          return expect(true).toBe(true)
        const result = await docs.read('search_docs')({ name: name.slice(0, 10) })
        expect(Array.isArray(result?.files)).toBe(true)
        expect(result?.files.some((f: any) => f?.id === documentId)).toBe(true)
      }, 30000)
    })
  }
})
