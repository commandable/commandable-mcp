import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createCredentialStore, createIntegrationNode, createProxy, createToolbox } from '../../__tests__/liveHarness.js'

const originalFetch = globalThis.fetch

function createSharePointToolbox() {
  const credentialStore = createCredentialStore(async () => ({ token: 'token-123' }))
  const proxy = createProxy(credentialStore)
  const node = createIntegrationNode('sharepoint', {
    label: 'SharePoint',
    credentialId: 'sharepoint-creds',
    credentialVariant: 'bearer_token',
  })
  return createToolbox('sharepoint', proxy, node, 'bearer_token')
}

describe('sharepoint handlers', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('search_files flattens Graph search hits and applies site filters', async () => {
    const fetchSpy = vi.fn(async (_url: string, init?: RequestInit) => new Response(JSON.stringify({
      value: [{
        hitsContainers: [{
          total: 2,
          moreResultsAvailable: false,
          hits: [
            {
              rank: 1,
              summary: '<c0>Quarterly</c0> report',
              resource: {
                id: 'item-1',
                name: 'Quarterly Report.docx',
                webUrl: 'https://contoso.sharepoint.com/sites/Finance/Shared%20Documents/Quarterly%20Report.docx',
                createdDateTime: '2026-01-01T00:00:00Z',
                lastModifiedDateTime: '2026-01-02T00:00:00Z',
                size: 1234,
                file: { mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
                parentReference: { siteId: 'site-1', driveId: 'drive-1' },
              },
            },
            {
              rank: 2,
              summary: 'Other file',
              resource: {
                id: 'item-2',
                name: 'Other.txt',
                parentReference: { siteId: 'site-2', driveId: 'drive-2' },
                file: { mimeType: 'text/plain' },
              },
            },
          ],
        }],
      }],
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }))
    globalThis.fetch = fetchSpy as any

    const sharepoint = createSharePointToolbox()
    const result = await sharepoint.read('search_files')({ query: 'quarterly', siteId: 'site-1' })

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect((fetchSpy.mock.calls[0]![1] as any)?.headers?.Authorization).toBe('Bearer token-123')
    expect((fetchSpy.mock.calls[0]![1] as any)?.method).toBe('POST')
    expect(result?.hits).toHaveLength(1)
    expect(result?.hits?.[0]?.id).toBe('item-1')
    expect(result?.hits?.[0]?.mimeType).toContain('wordprocessingml')
    expect(result?.hits?.[0]?.siteId).toBe('site-1')
  })

  it('read_file_content returns a clear folder message without downloading', async () => {
    const fetchSpy = vi.fn(async () => new Response(JSON.stringify({
      id: 'folder-1',
      name: 'Policies',
      folder: { childCount: 3 },
      webUrl: 'https://contoso.sharepoint.com/sites/Legal/Shared%20Documents/Policies',
      parentReference: { siteId: 'site-1', driveId: 'drive-1' },
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }))
    globalThis.fetch = fetchSpy as any

    const sharepoint = createSharePointToolbox()
    const result = await sharepoint.read('read_file_content')({ driveId: 'drive-1', itemId: 'folder-1' })

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(result?.message).toBe('Folders do not have readable file content.')
    expect(result?.content).toBeNull()
  })

  it('create_folder posts the expected Graph body', async () => {
    const fetchSpy = vi.fn(async (_url: string, _init?: RequestInit) => new Response(JSON.stringify({
      id: 'folder-1',
      name: 'CmdTest',
      webUrl: 'https://contoso.sharepoint.com/sites/Team/Shared%20Documents/CmdTest',
      folder: { childCount: 0 },
      parentReference: { driveId: 'drive-1' },
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }))
    globalThis.fetch = fetchSpy as any

    const sharepoint = createSharePointToolbox()
    const result = await sharepoint.write('create_folder')({
      driveId: 'drive-1',
      name: 'CmdTest',
      conflictBehavior: 'rename',
    })

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(String(fetchSpy.mock.calls[0]![0])).toContain('/drives/drive-1/root/children')
    expect((fetchSpy.mock.calls[0]![1] as any)?.method).toBe('POST')
    expect(String((fetchSpy.mock.calls[0]![1] as any)?.body || '')).toContain('"@microsoft.graph.conflictBehavior":"rename"')
    expect(result?.id).toBe('folder-1')
    expect(result?.isFolder).toBe(true)
  })
})
