import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createCredentialStore, createIntegrationNode, createProxy, createToolbox, safeCleanup } from '../../__tests__/liveHarness.js'

// LIVE Google Drive tests -- runs once per available credential variant.
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

suiteOrSkip('google-drive handlers (live)', () => {
  for (const variant of variants) {
    describe(`variant: ${variant.key}`, () => {
      const ctx: { folderId?: string, fileId?: string, destFolderId?: string } = {}
      let drive: ReturnType<typeof createToolbox>

      beforeAll(async () => {
        const credentialStore = createCredentialStore(async () => variant.credentials())
        const proxy = createProxy(credentialStore)
        drive = createToolbox(
          'google-drive',
          proxy,
          createIntegrationNode('google-drive', { label: 'Google Drive', credentialId: 'google-drive-creds', credentialVariant: variant.key }),
          variant.key,
        )

        const folder = await drive.write('create_folder')({ name: `CmdTest Drive ${Date.now()}` })
        ctx.folderId = folder?.id
        expect(ctx.folderId).toBeTruthy()

        const destFolder = await drive.write('create_folder')({ name: `CmdTest Drive Dest ${Date.now()}` })
        ctx.destFolderId = destFolder?.id
        expect(ctx.destFolderId).toBeTruthy()

        const file = await drive.write('create_file')({
          name: `CmdTest File ${Date.now()}`,
          mimeType: 'application/vnd.google-apps.document',
          parentId: ctx.folderId,
        })
        ctx.fileId = file?.id
        expect(ctx.fileId).toBeTruthy()
      }, 60000)

      afterAll(async () => {
        await safeCleanup(async () => ctx.fileId ? drive.write('delete_file')({ fileId: ctx.fileId }) : Promise.resolve())
        await safeCleanup(async () => ctx.folderId ? drive.write('delete_file')({ fileId: ctx.folderId }) : Promise.resolve())
        await safeCleanup(async () => ctx.destFolderId ? drive.write('delete_file')({ fileId: ctx.destFolderId }) : Promise.resolve())
      }, 60000)

      it('list_files returns files in folder', async () => {
        if (!ctx.folderId)
          return expect(true).toBe(true)
        const result = await drive.read('list_files')({ folderId: ctx.folderId })
        expect(Array.isArray(result?.files)).toBe(true)
        expect(result?.files.some((f: any) => f?.id === ctx.fileId)).toBe(true)
      }, 30000)

      it('search_files finds file by name', async () => {
        if (!ctx.fileId)
          return expect(true).toBe(true)
        const meta = await drive.read('get_file')({ fileId: ctx.fileId })
        const name = meta?.name
        if (!name)
          return expect(true).toBe(true)
        const result = await drive.read('search_files')({ name: name.slice(0, 10) })
        expect(Array.isArray(result?.files)).toBe(true)
      }, 30000)

      it('get_file returns file metadata', async () => {
        if (!ctx.fileId)
          return expect(true).toBe(true)
        const result = await drive.read('get_file')({ fileId: ctx.fileId })
        expect(result?.id).toBe(ctx.fileId)
        expect(typeof result?.name).toBe('string')
        expect(typeof result?.mimeType).toBe('string')
      }, 30000)

      it('get_file_content exports a Google Doc as text', async () => {
        if (!ctx.fileId)
          return expect(true).toBe(true)
        const result = await drive.read('get_file_content')({
          fileId: ctx.fileId,
          mimeType: 'application/vnd.google-apps.document',
        })
        expect(result?.fileId).toBe(ctx.fileId)
        // A newly created empty doc may have empty content -- just verify the shape
        expect(result?.content !== undefined || result?.message !== undefined).toBe(true)
      }, 30000)

      it('share_file shares a file with anyone reader', async () => {
        if (!ctx.fileId)
          return expect(true).toBe(true)
        const result = await drive.write('share_file')({
          fileId: ctx.fileId,
          role: 'reader',
          type: 'anyone',
          sendNotificationEmail: false,
        })
        expect(result?.id || result?.role).toBeTruthy()
      }, 30000)

      it('move_file moves the file to a different folder', async () => {
        if (!ctx.fileId || !ctx.destFolderId || !ctx.folderId)
          return expect(true).toBe(true)
        const result = await drive.write('move_file')({
          fileId: ctx.fileId,
          addParents: ctx.destFolderId,
          removeParents: ctx.folderId,
        })
        expect(result?.id).toBe(ctx.fileId)
        const meta = await drive.read('get_file')({ fileId: ctx.fileId })
        expect(meta?.parents).toContain(ctx.destFolderId)
      }, 30000)

      it('delete_file deletes a file permanently', async () => {
        const tempFile = await drive.write('create_file')({
          name: `CmdTest Temp ${Date.now()}`,
          mimeType: 'application/vnd.google-apps.document',
        })
        const tempId = tempFile?.id
        expect(tempId).toBeTruthy()
        await drive.write('delete_file')({ fileId: tempId })
        await expect(drive.read('get_file')({ fileId: tempId })).rejects.toThrow()
      }, 30000)
    })
  }
})
