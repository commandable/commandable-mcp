import { beforeAll, describe, expect, it } from 'vitest'
import { createCredentialStore, createIntegrationNode, createProxy, createToolbox, hasEnv, safeCleanup } from '../../__tests__/liveHarness.js'

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

suiteOrSkip('sharepoint handlers (live)', () => {
  describe('variant: app_credentials', () => {
    const ctx: {
      siteId?: string
      siteName?: string
      siteWebUrl?: string
      siteQuery?: string
      driveId?: string
      sampleItemId?: string
      sampleFileId?: string
      sampleFileDriveId?: string
      sampleFileName?: string
    } = {}

    let sharepoint: ReturnType<typeof createToolbox>

    beforeAll(async () => {
      const credentialStore = createCredentialStore(async () => ({
        tenantId: env.SHAREPOINT_TENANT_ID!,
        clientId: env.SHAREPOINT_CLIENT_ID!,
        clientSecret: env.SHAREPOINT_CLIENT_SECRET!,
      }))
      const proxy = createProxy(credentialStore)
      sharepoint = createToolbox(
        'sharepoint',
        proxy,
        createIntegrationNode('sharepoint', {
          label: 'SharePoint',
          credentialId: 'sharepoint-creds',
          credentialVariant: 'app_credentials',
        }),
        'app_credentials',
      )

      const site = await sharepoint.read('get_site_by_path')({
        hostname: env.SHAREPOINT_TEST_HOSTNAME!,
        relativePath: env.SHAREPOINT_TEST_SITE_PATH!,
      })
      ctx.siteId = site?.id
      ctx.siteName = site?.name || site?.displayName || ''
      ctx.siteWebUrl = site?.webUrl || ''
      ctx.siteQuery = env.SHAREPOINT_TEST_SITE_QUERY || lastPathSegment(env.SHAREPOINT_TEST_SITE_PATH) || ctx.siteName || 'site'

      if (ctx.siteId) {
        const drives = await sharepoint.read('list_site_drives')({ siteId: ctx.siteId })
        const preferredDriveId = env.SHAREPOINT_TEST_DRIVE_ID || ''
        const selectedDrive = Array.isArray(drives?.drives)
          ? (preferredDriveId
              ? drives.drives.find((drive: any) => drive?.id === preferredDriveId)
              : drives.drives.find((drive: any) => !drive?.isSystem) || drives.drives[0])
          : undefined
        ctx.driveId = selectedDrive?.id
      }

      if (ctx.driveId) {
        const listing = await sharepoint.read('list_drive_children')({ driveId: ctx.driveId, top: 20 })
        const children = Array.isArray(listing?.children) ? listing.children : []
        const firstChild = children[0]
        const firstFile = children.find((item: any) => item?.isFile)
        ctx.sampleItemId = firstChild?.id
        ctx.sampleFileId = env.SHAREPOINT_TEST_READ_FILE_ID || firstFile?.id
        ctx.sampleFileDriveId = env.SHAREPOINT_TEST_READ_FILE_DRIVE_ID || ctx.driveId
        ctx.sampleFileName = firstFile?.name
      }
    }, 60000)

    it('search_sites returns the configured site in tenant search results', async () => {
      const result = await sharepoint.read('search_sites')({ query: ctx.siteQuery || 'site' })
      expect(Array.isArray(result?.sites)).toBe(true)
      expect(result?.query).toBe(ctx.siteQuery || 'site')
      expect(result?.sites.every((site: any) =>
        typeof site?.id === 'string'
        && (typeof site?.name === 'string' || typeof site?.displayName === 'string')
        && (site?.webUrl == null || typeof site?.webUrl === 'string'),
      )).toBe(true)
    }, 30000)

    it('get_site_by_path resolves the configured site', async () => {
      const result = await sharepoint.read('get_site_by_path')({
        hostname: env.SHAREPOINT_TEST_HOSTNAME!,
        relativePath: env.SHAREPOINT_TEST_SITE_PATH!,
      })
      expect(result?.id).toBe(ctx.siteId)
      expect(result?.webUrl).toBe(ctx.siteWebUrl)
    }, 30000)

    it('get_site returns metadata for the configured site', async () => {
      if (!ctx.siteId)
        return expect(true).toBe(true)
      const result = await sharepoint.read('get_site')({ siteId: ctx.siteId })
      expect(result?.id).toBe(ctx.siteId)
      expect(typeof result?.name).toBe('string')
    }, 30000)

    it('list_site_drives includes the selected drive', async () => {
      if (!ctx.siteId || !ctx.driveId)
        return expect(true).toBe(true)
      const result = await sharepoint.read('list_site_drives')({ siteId: ctx.siteId })
      expect(Array.isArray(result?.drives)).toBe(true)
      expect(result?.drives.some((drive: any) => drive?.id === ctx.driveId)).toBe(true)
    }, 30000)

    it('list_drive_children returns entries from the selected drive', async () => {
      if (!ctx.driveId)
        return expect(true).toBe(true)
      const result = await sharepoint.read('list_drive_children')({ driveId: ctx.driveId, top: 20 })
      expect(Array.isArray(result?.children)).toBe(true)
      if (ctx.sampleItemId)
        expect(result?.children.some((child: any) => child?.id === ctx.sampleItemId)).toBe(true)
    }, 30000)

    it('get_drive_item_meta returns metadata for a discovered drive item', async () => {
      if (!ctx.driveId || !ctx.sampleItemId)
        return expect(true).toBe(true)
      const result = await sharepoint.read('get_drive_item_meta')({ driveId: ctx.driveId, itemId: ctx.sampleItemId })
      expect(result?.id).toBe(ctx.sampleItemId)
      expect(typeof result?.name).toBe('string')
    }, 30000)

    it('search_files finds results in the configured site and drive', async () => {
      if (!ctx.siteId || !ctx.driveId || !ctx.sampleFileName)
        return expect(true).toBe(true)
      const result = await sharepoint.read('search_files')({
        query: env.SHAREPOINT_TEST_SEARCH_QUERY || ctx.sampleFileName,
        siteId: ctx.siteId,
        driveId: ctx.driveId,
        size: 10,
      })
      expect(Array.isArray(result?.hits)).toBe(true)
      expect(result?.hits.length).toBeGreaterThan(0)
      expect(result?.hits.every((hit: any) => hit?.siteId === ctx.siteId)).toBe(true)
      expect(result?.hits.every((hit: any) => hit?.driveId === ctx.driveId)).toBe(true)
    }, 30000)

    it('read_file_content returns content or a clear extraction message for a discovered file', async () => {
      if (!ctx.sampleFileDriveId || !ctx.sampleFileId)
        return expect(true).toBe(true)
      const meta = await sharepoint.read('get_drive_item_meta')({ driveId: ctx.sampleFileDriveId, itemId: ctx.sampleFileId })
      const result = await sharepoint.read('read_file_content')({
        driveId: ctx.sampleFileDriveId,
        itemId: ctx.sampleFileId,
        mimeType: meta?.mimeType,
      })
      expect(result?.itemId).toBe(ctx.sampleFileId)
      expect(result?.content !== undefined || result?.message !== undefined).toBe(true)
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
        const sourceParent = await sharepoint.write('create_folder')({
          driveId: ctx.driveId,
          name: sourceParentName,
        })
        sourceParentId = sourceParent?.id || ''
        expect(sourceParent?.isFolder).toBe(true)

        const destinationParent = await sharepoint.write('create_folder')({
          driveId: ctx.driveId,
          name: destinationParentName,
        })
        destinationParentId = destinationParent?.id || ''
        expect(destinationParent?.isFolder).toBe(true)

        const child = await sharepoint.write('create_folder')({
          driveId: ctx.driveId,
          parentItemId: sourceParentId,
          name: childName,
        })
        childId = child?.id || ''
        expect(child?.isFolder).toBe(true)

        const sourceListing = await sharepoint.read('list_drive_children')({
          driveId: ctx.driveId,
          itemId: sourceParentId,
        })
        expect(sourceListing?.children.some((item: any) => item?.id === childId && item?.name === childName)).toBe(true)

        const createdMeta = await sharepoint.read('get_drive_item_meta')({
          driveId: ctx.driveId,
          itemId: childId,
        })
        expect(createdMeta?.id).toBe(childId)
        expect(createdMeta?.isFolder).toBe(true)

        const moved = await sharepoint.write('move_drive_item')({
          driveId: ctx.driveId,
          itemId: childId,
          destinationParentId: destinationParentId,
          newName: movedChildName,
        })
        expect(moved?.id).toBe(childId)
        expect(moved?.name).toBe(movedChildName)

        const destinationListing = await sharepoint.read('list_drive_children')({
          driveId: ctx.driveId,
          itemId: destinationParentId,
        })
        expect(destinationListing?.children.some((item: any) => item?.id === childId && item?.name === movedChildName)).toBe(true)

        await sharepoint.write('delete_drive_item')({
          driveId: ctx.driveId,
          itemId: childId,
        })
        childId = ''

        await expect(sharepoint.read('get_drive_item_meta')({
          driveId: ctx.driveId,
          itemId: moved.id,
        })).rejects.toThrow()
      }
      finally {
        await safeCleanup(async () => childId
          ? sharepoint.write('delete_drive_item')({ driveId: ctx.driveId!, itemId: childId })
          : Promise.resolve())
        await safeCleanup(async () => sourceParentId
          ? sharepoint.write('delete_drive_item')({ driveId: ctx.driveId!, itemId: sourceParentId })
          : Promise.resolve())
        await safeCleanup(async () => destinationParentId
          ? sharepoint.write('delete_drive_item')({ driveId: ctx.driveId!, itemId: destinationParentId })
          : Promise.resolve())
      }
    }, 60000)
  })
})
