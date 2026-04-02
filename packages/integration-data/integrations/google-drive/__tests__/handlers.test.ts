import { readFileSync, statSync } from 'node:fs'
import { extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getGoogleAccessToken } from '../../../../core/src/integrations/googleServiceAccount.js'
import { createCredentialStore, createIntegrationNode, createProxy, createToolbox, safeCleanup } from '../../__tests__/liveHarness.js'

/** Must appear in extractable text in every shared fixture under `integrations/__tests__/fixtures/file-extraction/`. */
const INTEGRATION_TEST_MARKER = 'Commandable Integration Test'

// LIVE Google Drive tests -- runs once per available credential variant.
// Required env vars (at least one):
// - GOOGLE_SERVICE_ACCOUNT_JSON  (service_account variant)
// - GOOGLE_TOKEN                 (oauth_token variant)

const env = process.env as Record<string, string | undefined>
const DRIVE_UPLOAD_SCOPES = ['https://www.googleapis.com/auth/drive']
const DRIVE_UPLOAD_FIELDS = 'id,name,mimeType,size,parents'

const LIVE_BINARY_FIXTURES = [
  { fileName: 'sample.docx', expectedKind: 'docx' },
  { fileName: 'sample.xlsx', expectedKind: 'xlsx' },
  { fileName: 'sample.pptx', expectedKind: 'pptx' },
  { fileName: 'sample.pdf', expectedKind: 'pdf' },
] as const

function fixturePath(fileName: string): string {
  return fileURLToPath(new URL(`../../__tests__/fixtures/file-extraction/${fileName}`, import.meta.url))
}

function fixtureMimeType(fileName: string): string {
  switch (extname(fileName).toLowerCase()) {
    case '.docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    case '.xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    case '.pptx':
      return 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    case '.pdf':
      return 'application/pdf'
    default:
      return 'application/octet-stream'
  }
}

function ensureFixtureReady(fileName: string): string {
  const path = fixturePath(fileName)
  const stats = statSync(path, { throwIfNoEntry: false })
  if (!stats) {
    throw new Error(`Missing integration test fixture: ${path}`)
  }
  if (stats.size === 0) {
    throw new Error(`Integration test fixture is still an empty placeholder: ${path}. Replace it with a real file that contains "${INTEGRATION_TEST_MARKER}" in extractable text.`)
  }
  return path
}

async function resolveDriveUploadToken(variant: VariantConfig): Promise<string> {
  if (variant.key === 'service_account') {
    return await getGoogleAccessToken({
      serviceAccountJson: env.GOOGLE_SERVICE_ACCOUNT_JSON || '',
      subject: env.GOOGLE_IMPERSONATE_SUBJECT || '',
      scopes: DRIVE_UPLOAD_SCOPES,
    })
  }

  const token = env.GOOGLE_TOKEN || ''
  if (!token.trim())
    throw new Error('Missing GOOGLE_TOKEN for oauth_token Google Drive upload tests.')
  return token
}

async function uploadDriveFixture(args: {
  token: string
  parentId: string
  fileName: string
  fixturePath: string
}): Promise<{ id: string, name: string, mimeType: string }> {
  const bytes = readFileSync(args.fixturePath)
  const boundary = `commandable-drive-${Date.now()}-${Math.random().toString(16).slice(2)}`
  const metadata = JSON.stringify({
    name: args.fileName,
    parents: [args.parentId],
  })

  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Type: ${fixtureMimeType(args.fileName)}\r\n\r\n`),
    bytes,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ])

  const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=${encodeURIComponent(DRIVE_UPLOAD_FIELDS)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${args.token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  })

  if (!res.ok) {
    const bodyText = await res.text().catch(() => '')
    throw new Error(`Drive fixture upload failed (${res.status})${bodyText ? `: ${bodyText}` : ''}`)
  }

  return await res.json()
}

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
        const meta = await drive.read('get_file_meta')({ fileId: ctx.fileId })
        const name = meta?.name
        if (!name)
          return expect(true).toBe(true)
        const result = await drive.read('search_files')({ name: name.slice(0, 10) })
        expect(Array.isArray(result?.files)).toBe(true)
      }, 30000)

      it('get_file_meta returns file metadata', async () => {
        if (!ctx.fileId)
          return expect(true).toBe(true)
        const result = await drive.read('get_file_meta')({ fileId: ctx.fileId })
        expect(result?.id).toBe(ctx.fileId)
        expect(typeof result?.name).toBe('string')
        expect(typeof result?.mimeType).toBe('string')
      }, 30000)

      it('read_file_content exports a Google Doc as text', async () => {
        if (!ctx.fileId)
          return expect(true).toBe(true)
        const result = await drive.read('read_file_content')({
          fileId: ctx.fileId,
          mimeType: 'application/vnd.google-apps.document',
        })
        expect(result?.fileId).toBe(ctx.fileId)
        // A newly created empty doc may have empty content -- just verify the shape
        expect(result?.content !== undefined || result?.message !== undefined).toBe(true)
      }, 30000)

      it.each(LIVE_BINARY_FIXTURES)('read_file_content extracts uploaded $fileName fixtures', async ({ fileName, expectedKind }) => {
        if (!ctx.folderId)
          return expect(true).toBe(true)

        const sourcePath = ensureFixtureReady(fileName)
        const token = await resolveDriveUploadToken(variant)
        let uploadedId = ''

        try {
          const uploaded = await uploadDriveFixture({
            token,
            parentId: ctx.folderId,
            fileName,
            fixturePath: sourcePath,
          })
          uploadedId = uploaded.id
          expect(uploadedId).toBeTruthy()

          const meta = await drive.read('get_file_meta')({ fileId: uploadedId })
          expect(meta?.id).toBe(uploadedId)
          expect(typeof meta?.mimeType).toBe('string')

          const result = await drive.read('read_file_content')({
            fileId: uploadedId,
            mimeType: meta?.mimeType,
          })

          expect(result?.fileId).toBe(uploadedId)
          expect(result?.kind).toBe(expectedKind)
          expect(typeof result?.content).toBe('string')
          expect(String(result?.content || '').trim().length).toBeGreaterThan(0)
          expect(String(result?.content || '')).toContain(INTEGRATION_TEST_MARKER)
          expect(result?.message).toBeUndefined()
        }
        finally {
          await safeCleanup(async () => uploadedId ? drive.write('delete_file')({ fileId: uploadedId }) : Promise.resolve())
        }
      }, 90000)

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
        const meta = await drive.read('get_file_meta')({ fileId: ctx.fileId })
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
        await expect(drive.read('get_file_meta')({ fileId: tempId })).rejects.toThrow()
      }, 30000)
    })
  }
})
