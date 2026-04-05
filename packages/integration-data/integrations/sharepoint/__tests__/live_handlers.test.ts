import { beforeAll, describe, expect, it } from 'vitest'
import { createCredentialStore, createIntegrationNode, createProxy, createToolbox, hasEnv, safeCleanup } from '../../__tests__/liveHarness.js'

const env = process.env as Record<string, string | undefined>

const suiteOrSkip = hasEnv('SHAREPOINT_TOKEN', 'SHAREPOINT_TEST_HOSTNAME', 'SHAREPOINT_TEST_SITE_PATH')
  ? describe
  : describe.skip

suiteOrSkip('sharepoint handlers (live)', () => {
  describe('variant: bearer_token', () => {
    const ctx: {
      siteId?: string
      siteName?: string
      siteQuery?: string
      driveId?: string
      sampleItemId?: string
      sampleItemIsFile?: boolean
      sampleFileId?: string
      sampleFileDriveId?: string
      sampleFileName?: string
    } = {}

    let sharepoint: ReturnType<typeof createToolbox>

    beforeAll(async () => {
      const credentialStore = createCredentialStore(async () => ({ token: env.SHAREPOINT_TOKEN! }))
      const proxy = createProxy(credentialStore)
      sharepoint = createToolbox(
        'sharepoint',
        proxy,
        createIntegrationNode('sharepoint', {
          label: 'SharePoint',
          credentialId: 'sharepoint-creds',
          credentialVariant: 'bearer_token',
        }),
        'bearer_token',
      )

      const get_site_by_path = sharepoint.read('get_site_by_path')
      const site = await get_site_by_path({
        hostname: env.SHAREPOINT_TEST_HOSTNAME!,
        relativePath: env.SHAREPOINT_TEST_SITE_PATH!,
      })
      ctx.siteId = site?.id
      ctx.siteName = site?.name || site?.displayName || ''
      ctx.siteQuery = env.SHAREPOINT_TEST_SITE_QUERY || String(env.SHAREPOINT_TEST_SITE_PATH || '').split('/').filter(Boolean).pop() || ctx.siteName || 'site'

      if (ctx.siteId) {
        const list_site_drives = sharepoint.read('list_site_drives')
        const drives = await list_site_drives({ siteId: ctx.siteId })
        const preferredDriveId = env.SHAREPOINT_TEST_DRIVE_ID || ''
        const selectedDrive = Array.isArray(drives?.drives)
          ? (preferredDriveId
              ? drives.drives.find((drive: any) => drive?.id === preferredDriveId)
              : drives.drives.find((drive: any) => !drive?.isSystem) || drives.drives[0])
          : undefined
        ctx.driveId = selectedDrive?.id
      }

      if (ctx.driveId) {
        const list_drive_children = sharepoint.read('list_drive_children')
        const listing = await list_drive_children({ driveId: ctx.driveId, top: 20 })
        const children = Array.isArray(listing?.children) ? listing.children : []
        const firstChild = children[0]
        const firstFile = children.find((item: any) => item?.isFile)
        ctx.sampleItemId = firstChild?.id
        ctx.sampleItemIsFile = Boolean(firstChild?.isFile)
        ctx.sampleFileId = env.SHAREPOINT_TEST_READ_FILE_ID || firstFile?.id
        ctx.sampleFileDriveId = env.SHAREPOINT_TEST_READ_FILE_DRIVE_ID || ctx.driveId
        ctx.sampleFileName = firstFile?.name
      }
    }, 60000)

    it('search_sites returns site summaries', async () => {
      const handler = sharepoint.read('search_sites')
      const result = await handler({ query: ctx.siteQuery || 'site' })
      expect(Array.isArray(result?.sites)).toBe(true)
    }, 30000)

    it('get_site_by_path resolves the configured site', async () => {
      const handler = sharepoint.read('get_site_by_path')
      const result = await handler({
        hostname: env.SHAREPOINT_TEST_HOSTNAME!,
        relativePath: env.SHAREPOINT_TEST_SITE_PATH!,
      })
      expect(result?.id).toBeTruthy()
      expect(typeof result?.webUrl).toBe('string')
    }, 30000)

    it('get_site returns site metadata', async () => {
      if (!ctx.siteId)
        return expect(true).toBe(true)
      const handler = sharepoint.read('get_site')
      const result = await handler({ siteId: ctx.siteId })
      expect(result?.id).toBe(ctx.siteId)
    }, 30000)

    it('list_site_drives returns drives', async () => {
      if (!ctx.siteId)
        return expect(true).toBe(true)
      const handler = sharepoint.read('list_site_drives')
      const result = await handler({ siteId: ctx.siteId, top: 20 })
      expect(Array.isArray(result?.drives)).toBe(true)
    }, 30000)

    it('list_drive_children returns drive items', async () => {
      if (!ctx.driveId)
        return expect(true).toBe(true)
      const handler = sharepoint.read('list_drive_children')
      const result = await handler({ driveId: ctx.driveId, top: 20 })
      expect(Array.isArray(result?.children)).toBe(true)
    }, 30000)

    it('get_drive_item returns metadata for a discovered item when available', async () => {
      if (!ctx.driveId || !ctx.sampleItemId)
        return expect(true).toBe(true)
      const handler = sharepoint.read('get_drive_item')
      const result = await handler({ driveId: ctx.driveId, itemId: ctx.sampleItemId })
      expect(result?.id).toBe(ctx.sampleItemId)
    }, 30000)

    it('search_files returns flattened hits', async () => {
      const query = env.SHAREPOINT_TEST_SEARCH_QUERY || ctx.sampleFileName || ctx.siteQuery || 'document'
      const handler = sharepoint.read('search_files')
      const result = await handler({
        query,
        ...(ctx.siteId ? { siteId: ctx.siteId } : {}),
        ...(ctx.driveId ? { driveId: ctx.driveId } : {}),
        size: 10,
      })
      expect(Array.isArray(result?.hits)).toBe(true)
    }, 30000)

    it('read_file_content extracts text from a discovered file when available', async () => {
      if (!ctx.sampleFileDriveId || !ctx.sampleFileId)
        return expect(true).toBe(true)
      const meta = await sharepoint.read('get_drive_item')({ driveId: ctx.sampleFileDriveId, itemId: ctx.sampleFileId })
      const result = await sharepoint.read('read_file_content')({
        driveId: ctx.sampleFileDriveId,
        itemId: ctx.sampleFileId,
        mimeType: meta?.mimeType,
      })
      expect(result?.itemId).toBe(ctx.sampleFileId)
      expect(result?.message !== undefined || typeof result?.content === 'string').toBe(true)
    }, 90000)

    it('create_folder creates a folder in the drive root', async () => {
      if (!ctx.driveId)
        return expect(true).toBe(true)
      let folderId = ''
      try {
        const handler = sharepoint.write('create_folder')
        const result = await handler({ driveId: ctx.driveId, name: `CmdTest SharePoint ${Date.now()}` })
        folderId = result?.id || ''
        expect(folderId).toBeTruthy()
        expect(result?.isFolder).toBe(true)
      }
      finally {
        await safeCleanup(async () => folderId ? sharepoint.write('delete_drive_item')({ driveId: ctx.driveId, itemId: folderId }) : Promise.resolve())
      }
    }, 30000)

    it('move_drive_item moves a folder between parents', async () => {
      if (!ctx.driveId)
        return expect(true).toBe(true)
      let sourceId = ''
      let destinationId = ''
      try {
        sourceId = (await sharepoint.write('create_folder')({ driveId: ctx.driveId, name: `CmdMove Source ${Date.now()}` }))?.id || ''
        destinationId = (await sharepoint.write('create_folder')({ driveId: ctx.driveId, name: `CmdMove Dest ${Date.now()}` }))?.id || ''
        expect(sourceId).toBeTruthy()
        expect(destinationId).toBeTruthy()

        const moved = await sharepoint.write('move_drive_item')({
          driveId: ctx.driveId,
          itemId: sourceId,
          destinationParentId: destinationId,
        })
        expect(moved?.id).toBe(sourceId)

        const meta = await sharepoint.read('get_drive_item')({ driveId: ctx.driveId, itemId: sourceId })
        expect(meta?.parentReference?.id).toBe(destinationId)
      }
      finally {
        await safeCleanup(async () => sourceId ? sharepoint.write('delete_drive_item')({ driveId: ctx.driveId, itemId: sourceId }) : Promise.resolve())
        await safeCleanup(async () => destinationId ? sharepoint.write('delete_drive_item')({ driveId: ctx.driveId, itemId: destinationId }) : Promise.resolve())
      }
    }, 60000)

    it('delete_drive_item deletes a created folder', async () => {
      if (!ctx.driveId)
        return expect(true).toBe(true)
      const folder = await sharepoint.write('create_folder')({ driveId: ctx.driveId, name: `CmdDelete ${Date.now()}` })
      const folderId = folder?.id
      expect(folderId).toBeTruthy()

      const result = await sharepoint.write('delete_drive_item')({ driveId: ctx.driveId, itemId: folderId })
      expect(result?.success).toBe(true)
      await expect(sharepoint.read('get_drive_item')({ driveId: ctx.driveId, itemId: folderId })).rejects.toThrow()
    }, 60000)
  })
})
