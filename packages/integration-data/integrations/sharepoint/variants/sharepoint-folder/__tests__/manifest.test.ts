import { describe, expect, it } from 'vitest'
import { loadIntegrationCredentialConfig, loadIntegrationManifest, loadIntegrationTools } from '../../../../../src/loader.ts'

describe('sharepoint-folder manifest', () => {
  it('inherits sharepoint provider metadata and exposes 3-step folder variant config', () => {
    const manifest = loadIntegrationManifest('sharepoint-folder')
    expect(manifest?.variantLabel).toBe('Single folder')
    expect(manifest?.variantConfig).toHaveLength(3)
    expect(manifest?.variantConfig).toEqual([
      expect.objectContaining({ key: 'site', label: 'Site', selectionMode: 'single', listHandler: expect.any(String) }),
      expect.objectContaining({ key: 'drive', label: 'Document library', selectionMode: 'single', listHandler: expect.any(String) }),
      expect.objectContaining({ key: 'folder', label: 'Folder', selectionMode: 'single', listHandler: expect.any(String) }),
    ])
  })

  it('inherits sharepoint credentials from the parent integration', () => {
    const credentials = loadIntegrationCredentialConfig('sharepoint-folder')
    expect(credentials).toBeTruthy()
  })

  it('injects driveId into list_folder and strips it from the schema', () => {
    const tools = loadIntegrationTools('sharepoint-folder')
    const listFolder = tools?.read.find(t => t.name === 'list_folder')
    expect(listFolder).toBeTruthy()
    expect(listFolder?.injectFromConfig).toMatchObject({ driveId: 'driveId' })
    expect((listFolder?.inputSchema as any)?.properties?.driveId).toBeUndefined()
  })

  it('injects folderId as itemId for list_folder and strips itemId from the schema', () => {
    const tools = loadIntegrationTools('sharepoint-folder')
    const listFolder = tools?.read.find(t => t.name === 'list_folder')
    expect(listFolder?.injectFromConfig).toMatchObject({ itemId: 'folderId' })
    expect((listFolder?.inputSchema as any)?.properties?.itemId).toBeUndefined()
  })

  it('browse_folder only injects driveId and keeps itemId user-provided', () => {
    const tools = loadIntegrationTools('sharepoint-folder')
    const browseFolder = tools?.read.find(t => t.name === 'browse_folder')
    expect(browseFolder?.injectFromConfig).toEqual({ driveId: 'driveId' })
    expect((browseFolder?.inputSchema as any)?.properties?.itemId).toBeDefined()
  })

  it('injects folderId as parentItemId for create_folder and strips it from the schema', () => {
    const tools = loadIntegrationTools('sharepoint-folder')
    const createFolder = tools?.write.find(t => t.name === 'create_folder')
    expect(createFolder?.injectFromConfig).toMatchObject({ driveId: 'driveId', parentItemId: 'folderId' })
    expect((createFolder?.inputSchema as any)?.properties?.parentItemId).toBeUndefined()
    expect((createFolder?.inputSchema as any)?.properties?.driveId).toBeUndefined()
  })

  it('injects siteId and driveId into search_files and strips both from the schema', () => {
    const tools = loadIntegrationTools('sharepoint-folder')
    const searchFiles = tools?.read.find(t => t.name === 'search_files')
    expect(searchFiles?.injectFromConfig).toEqual({ siteId: 'siteId', driveId: 'driveId' })
    expect((searchFiles?.inputSchema as any)?.properties?.siteId).toBeUndefined()
    expect((searchFiles?.inputSchema as any)?.properties?.driveId).toBeUndefined()
  })

  it('excludes site-discovery tools', () => {
    const tools = loadIntegrationTools('sharepoint-folder')
    const allNames = [...(tools?.read ?? []), ...(tools?.write ?? [])].map(t => t.name)
    expect(allNames).not.toContain('search_sites')
    expect(allNames).not.toContain('get_site')
    expect(allNames).not.toContain('get_site_by_path')
    expect(allNames).not.toContain('list_site_drives')
  })
})
