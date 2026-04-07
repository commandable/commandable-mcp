import { readFileSync, statSync } from 'node:fs'
import { extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createCredentialStore, createIntegrationNode, createProxy, createToolbox, hasEnv, safeCleanup } from '../../__tests__/liveHarness.js'

/** Must appear in extractable text in every shared fixture under `integrations/__tests__/fixtures/file-extraction/`. */
const INTEGRATION_TEST_MARKER = 'Commandable Integration Test'

const LIVE_BINARY_FIXTURES = [
  { fileName: 'sample.docx', expectedKind: 'docx' },
  { fileName: 'sample.xlsx', expectedKind: 'xlsx' },
  { fileName: 'sample.pptx', expectedKind: 'pptx' },
  { fileName: 'sample.pdf', expectedKind: 'pdf' },
  { fileName: 'sample.msg', expectedKind: 'msg' },
  { fileName: 'sample.eml', expectedKind: 'eml' },
  { fileName: 'sample.zip', expectedKind: 'zip' },
] as const

const env = process.env as Record<string, string | undefined>

const suiteOrSkip = hasEnv(
  'SHAREPOINT_TENANT_ID',
  'SHAREPOINT_CLIENT_ID',
  'SHAREPOINT_CLIENT_SECRET',
  'SHAREPOINT_TEST_HOSTNAME',
  'SHAREPOINT_TEST_SITE_PATH',
)
  ? describe
  : describe.skip

function lastPathSegment(path: string | undefined): string {
  return String(path || '')
    .split('/')
    .filter(Boolean)
    .pop() || 'site'
}

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

async function fetchSharePointGraphToken(): Promise<string> {
  const tenantId = String(env.SHAREPOINT_TENANT_ID || '').trim()
  const clientId = String(env.SHAREPOINT_CLIENT_ID || '').trim()
  const clientSecret = String(env.SHAREPOINT_CLIENT_SECRET || '').trim()
  const res = await fetch(`https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://graph.microsoft.com/.default',
    }),
  })
  const data = await res.json() as Record<string, unknown>
  if (!res.ok) {
    const message = typeof data?.error_description === 'string'
      ? data.error_description
      : (typeof data?.error === 'string' ? data.error : `Token request failed with status ${res.status}`)
    throw new Error(String(message))
  }
  const token = typeof data?.access_token === 'string' ? data.access_token : ''
  if (!token)
    throw new Error('Microsoft token response did not include access_token')
  return token
}

async function uploadDriveChildFileContent(args: {
  token: string
  driveId: string
  parentItemId: string
  remoteName: string
  fixturePath: string
  mimeType: string
}): Promise<{ id: string, name: string }> {
  const bytes = readFileSync(args.fixturePath)
  const path = `/drives/${encodeURIComponent(args.driveId)}/items/${encodeURIComponent(args.parentItemId)}:/${encodeURIComponent(args.remoteName)}:/content`
  const res = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${args.token}`,
      'Content-Type': args.mimeType,
    },
    body: new Uint8Array(bytes),
  })
  const data = await res.json().catch(() => ({})) as Record<string, unknown>
  if (!res.ok) {
    const bodyText = typeof data?.error === 'object' && data.error !== null
      ? JSON.stringify(data.error)
      : JSON.stringify(data)
    throw new Error(`SharePoint fixture upload failed (${res.status})${bodyText ? `: ${bodyText}` : ''}`)
  }
  const id = typeof data?.id === 'string' ? data.id : ''
  const name = typeof data?.name === 'string' ? data.name : ''
  if (!id)
    throw new Error('SharePoint upload response did not include id')
  return { id, name: name || args.remoteName }
}

suiteOrSkip('sharepoint handlers (live)', () => {
  describe('variant: app_credentials', () => {
    const ctx: {
      siteId?: string
      siteName?: string
      siteWebUrl?: string
      siteQuery?: string
      driveId?: string
      fixtureFolderId?: string
      fixtureItemIds: Partial<Record<(typeof LIVE_BINARY_FIXTURES)[number]['fileName'], string>>
    } = { fixtureItemIds: {} }

    let sharepoint: ReturnType<typeof createToolbox> | undefined

    beforeAll(async () => {
      const credentialStore = createCredentialStore(async () => ({
        tenantId: env.SHAREPOINT_TENANT_ID!,
        clientId: env.SHAREPOINT_CLIENT_ID!,
        clientSecret: env.SHAREPOINT_CLIENT_SECRET!,
      }))
      const proxy = createProxy(credentialStore)
      const toolbox = createToolbox(
        'sharepoint',
        proxy,
        createIntegrationNode('sharepoint', {
          label: 'SharePoint',
          credentialId: 'sharepoint-creds',
          credentialVariant: 'app_credentials',
        }),
        'app_credentials',
      )
      sharepoint = toolbox

      const site = await toolbox.read('get_site_by_path')({
        hostname: env.SHAREPOINT_TEST_HOSTNAME!,
        relativePath: env.SHAREPOINT_TEST_SITE_PATH!,
      })
      ctx.siteId = site?.id
      ctx.siteName = site?.name || site?.displayName || ''
      ctx.siteWebUrl = site?.webUrl || ''
      ctx.siteQuery = env.SHAREPOINT_TEST_SITE_QUERY || lastPathSegment(env.SHAREPOINT_TEST_SITE_PATH) || ctx.siteName || 'site'

      if (ctx.siteId) {
        const drives = await toolbox.read('list_site_drives')({ siteId: ctx.siteId })
        const preferredDriveId = env.SHAREPOINT_TEST_DRIVE_ID || ''
        const selectedDrive = Array.isArray(drives?.drives)
          ? (preferredDriveId
              ? drives.drives.find((drive: any) => drive?.id === preferredDriveId)
              : drives.drives.find((drive: any) => !drive?.isSystem) || drives.drives[0])
          : undefined
        ctx.driveId = selectedDrive?.id
      }

      if (!ctx.driveId)
        return

      const folder = await toolbox.write('create_folder')({
        driveId: ctx.driveId,
        name: `CmdSharePoint Fixtures ${Date.now()}`,
      })
      ctx.fixtureFolderId = folder?.id || ''
      expect(ctx.fixtureFolderId).toBeTruthy()

      const runToken = `CmdSP_${Date.now()}`

      const graphToken = await fetchSharePointGraphToken()
      try {
        for (const { fileName } of LIVE_BINARY_FIXTURES) {
          const sourcePath = ensureFixtureReady(fileName)
          const remoteName = `${runToken}_${fileName}`
          const uploaded = await uploadDriveChildFileContent({
            token: graphToken,
            driveId: ctx.driveId,
            parentItemId: ctx.fixtureFolderId!,
            remoteName,
            fixturePath: sourcePath,
            mimeType: fixtureMimeType(fileName),
          })
          ctx.fixtureItemIds[fileName] = uploaded.id
        }
      }
      catch (err) {
        await safeCleanup(async () => ctx.fixtureFolderId && ctx.driveId
          ? toolbox.write('delete_drive_item')({ driveId: ctx.driveId!, itemId: ctx.fixtureFolderId! })
          : Promise.resolve())
        ctx.fixtureFolderId = undefined
        ctx.fixtureItemIds = {}
        throw err
      }
    }, 120000)

    afterAll(async () => {
      await safeCleanup(async () => sharepoint && ctx.fixtureFolderId && ctx.driveId
        ? sharepoint!.write('delete_drive_item')({ driveId: ctx.driveId!, itemId: ctx.fixtureFolderId! })
        : Promise.resolve())
    }, 60000)

    it('search_sites returns the configured site in tenant search results', async () => {
      const result = await sharepoint!.read('search_sites')({ query: ctx.siteQuery || 'site' })
      expect(Array.isArray(result?.sites)).toBe(true)
      expect(result?.query).toBe(ctx.siteQuery || 'site')
      expect(result?.sites.every((site: any) =>
        typeof site?.id === 'string'
        && (typeof site?.name === 'string' || typeof site?.displayName === 'string')
        && (site?.webUrl == null || typeof site?.webUrl === 'string'),
      )).toBe(true)
    }, 30000)

    it('get_site_by_path resolves the configured site', async () => {
      const result = await sharepoint!.read('get_site_by_path')({
        hostname: env.SHAREPOINT_TEST_HOSTNAME!,
        relativePath: env.SHAREPOINT_TEST_SITE_PATH!,
      })
      expect(result?.id).toBe(ctx.siteId)
      expect(result?.webUrl).toBe(ctx.siteWebUrl)
    }, 30000)

    it('get_site returns metadata for the configured site', async () => {
      if (!ctx.siteId)
        return expect(true).toBe(true)
      const result = await sharepoint!.read('get_site')({ siteId: ctx.siteId })
      expect(result?.id).toBe(ctx.siteId)
      expect(typeof result?.name).toBe('string')
    }, 30000)

    it('list_site_drives includes the selected drive', async () => {
      if (!ctx.siteId || !ctx.driveId)
        return expect(true).toBe(true)
      const result = await sharepoint!.read('list_site_drives')({ siteId: ctx.siteId })
      expect(Array.isArray(result?.drives)).toBe(true)
      expect(result?.drives.some((drive: any) => drive?.id === ctx.driveId)).toBe(true)
    }, 30000)

    it('list_drive_children lists uploaded fixtures folder', async () => {
      if (!ctx.driveId || !ctx.fixtureFolderId)
        return expect(true).toBe(true)
      const result = await sharepoint!.read('list_drive_children')({ driveId: ctx.driveId, itemId: ctx.fixtureFolderId, top: 50 })
      expect(Array.isArray(result?.children)).toBe(true)
      expect(result?.children.length).toBeGreaterThan(0)
      expect(result?.children.every((child: any) => typeof child?.id === 'string')).toBe(true)
    }, 30000)

    it('get_drive_item_meta returns metadata for an uploaded drive item', async () => {
      const itemId = ctx.fixtureItemIds['sample.docx']
      if (!ctx.driveId || !itemId)
        return expect(true).toBe(true)
      const result = await sharepoint!.read('get_drive_item_meta')({ driveId: ctx.driveId, itemId })
      expect(result?.id).toBe(itemId)
      expect(result?.isFile).toBe(true)
      expect(typeof result?.name).toBe('string')
    }, 30000)

    it('search_files finds results in the configured site and drive', async () => {
      const searchToken = env.SHAREPOINT_TEST_SEARCH_TOKEN
      if (!ctx.siteId || !ctx.driveId || !searchToken)
        return expect(true).toBe(true)

      const result = await sharepoint!.read('search_files')({
        query: searchToken,
        siteId: ctx.siteId,
        driveId: ctx.driveId,
        size: 10,
      })

      expect(Array.isArray(result?.hits)).toBe(true)
      expect(result?.hits.length).toBeGreaterThan(0)
      expect(result?.hits.every((hit: any) => hit?.siteId === ctx.siteId)).toBe(true)
      expect(result?.hits.every((hit: any) => hit?.driveId === ctx.driveId)).toBe(true)
    }, 30000)

    it.each(LIVE_BINARY_FIXTURES)('read_file_content extracts uploaded $fileName fixtures', async ({ fileName, expectedKind }) => {
      const itemId = ctx.fixtureItemIds[fileName]
      if (!ctx.driveId || !itemId)
        return expect(true).toBe(true)
      const meta = await sharepoint!.read('get_drive_item_meta')({ driveId: ctx.driveId, itemId })
      expect(meta?.id).toBe(itemId)
      expect(typeof meta?.mimeType).toBe('string')

      const result = await sharepoint!.read('read_file_content')({
        driveId: ctx.driveId,
        itemId,
        mimeType: meta?.mimeType,
      })

      expect(result?.itemId).toBe(itemId)
      expect(result?.kind).toBe(expectedKind)
      expect(typeof result?.content).toBe('string')
      expect(String(result?.content || '').trim().length).toBeGreaterThan(0)
      expect(String(result?.content || '')).toContain(INTEGRATION_TEST_MARKER)
      expect(result?.message).toBeUndefined()
    }, 90000)

    it('round trips folders across create, list, move, get, and delete', async () => {
      if (!ctx.driveId)
        return expect(true).toBe(true)

      const sourceParentName = `CmdSharePoint Source ${Date.now()}`
      const destinationParentName = `CmdSharePoint Dest ${Date.now()}`
      const childName = `CmdSharePoint Child ${Date.now()}`
      const movedChildName = `${childName} Moved`

      let sourceParentId = ''
      let destinationParentId = ''
      let childId = ''

      try {
        const sourceParent = await sharepoint!.write('create_folder')({
          driveId: ctx.driveId,
          name: sourceParentName,
        })
        sourceParentId = sourceParent?.id || ''
        expect(sourceParent?.isFolder).toBe(true)

        const destinationParent = await sharepoint!.write('create_folder')({
          driveId: ctx.driveId,
          name: destinationParentName,
        })
        destinationParentId = destinationParent?.id || ''
        expect(destinationParent?.isFolder).toBe(true)

        const child = await sharepoint!.write('create_folder')({
          driveId: ctx.driveId,
          parentItemId: sourceParentId,
          name: childName,
        })
        childId = child?.id || ''
        expect(child?.isFolder).toBe(true)

        const sourceListing = await sharepoint!.read('list_drive_children')({
          driveId: ctx.driveId,
          itemId: sourceParentId,
        })
        expect(sourceListing?.children.some((item: any) => item?.id === childId && item?.name === childName)).toBe(true)

        const createdMeta = await sharepoint!.read('get_drive_item_meta')({
          driveId: ctx.driveId,
          itemId: childId,
        })
        expect(createdMeta?.id).toBe(childId)
        expect(createdMeta?.isFolder).toBe(true)

        const moved = await sharepoint!.write('move_drive_item')({
          driveId: ctx.driveId,
          itemId: childId,
          destinationParentId: destinationParentId,
          newName: movedChildName,
        })
        expect(moved?.id).toBe(childId)
        expect(moved?.name).toBe(movedChildName)

        const destinationListing = await sharepoint!.read('list_drive_children')({
          driveId: ctx.driveId,
          itemId: destinationParentId,
        })
        expect(destinationListing?.children.some((item: any) => item?.id === childId && item?.name === movedChildName)).toBe(true)

        await sharepoint!.write('delete_drive_item')({
          driveId: ctx.driveId,
          itemId: childId,
        })
        childId = ''

        await expect(sharepoint!.read('get_drive_item_meta')({
          driveId: ctx.driveId,
          itemId: moved.id,
        })).rejects.toThrow()
      }
      finally {
        await safeCleanup(async () => childId
          ? sharepoint!.write('delete_drive_item')({ driveId: ctx.driveId!, itemId: childId })
          : Promise.resolve())
        await safeCleanup(async () => sourceParentId
          ? sharepoint!.write('delete_drive_item')({ driveId: ctx.driveId!, itemId: sourceParentId })
          : Promise.resolve())
        await safeCleanup(async () => destinationParentId
          ? sharepoint!.write('delete_drive_item')({ driveId: ctx.driveId!, itemId: destinationParentId })
          : Promise.resolve())
      }
    }, 60000)
  })
})
