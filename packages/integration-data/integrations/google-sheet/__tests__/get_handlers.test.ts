import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { IntegrationProxy } from '../../../../server/src/integrations/proxy.js'
import { loadIntegrationTools } from '../../../../server/src/integrations/dataLoader.js'

// LIVE Google Sheets read tests using credentials
// Required env vars:
// - Either GOOGLE_TOKEN, OR GOOGLE_SERVICE_ACCOUNT_JSON
// - GOOGLE_SHEETS_TEST_SPREADSHEET_ID (an accessible spreadsheet ID)

const env = process.env as Record<string, string>
const hasEnv = (...keys: string[]) => keys.every(k => !!env[k] && env[k].trim().length > 0)
const suite = (hasEnv('GOOGLE_TOKEN') || hasEnv('GOOGLE_SERVICE_ACCOUNT_JSON'))
  ? describe
  : describe.skip

suite('google-sheet read handlers (live)', () => {
  let buildReadHandler: (name: string) => ((input: any) => Promise<any>)
  let buildWriteHandler: (name: string) => ((input: any) => Promise<any>)
  let buildDriveWrite: (name: string) => ((input: any) => Promise<any>)
  let sheetTitle: string | undefined
  let folderId: string | undefined
  let spreadsheetId: string | undefined

  beforeAll(async () => {
    const credentialStore = {
      getCredentials: async () => ({
        token: env.GOOGLE_TOKEN || '',
        serviceAccountJson: env.GOOGLE_SERVICE_ACCOUNT_JSON || '',
      }),
    }

    const proxy = new IntegrationProxy({ credentialStore })
    const sheetsNode = {
      spaceId: 'ci',
      id: 'node-gsheets',
      referenceId: 'node-gsheets',
      type: 'google-sheet',
      label: 'Google Sheets',
      connectionMethod: 'credentials',
      credentialId: 'google-sheet-creds',
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

    const tools = loadIntegrationTools('google-sheet')
    expect(tools).toBeTruthy()

    const driveTools = loadIntegrationTools('google-drive')
    expect(driveTools).toBeTruthy()

    buildReadHandler = (name: string) => {
      const tool = tools!.read.find(t => t.name === name)
      expect(tool, `read tool ${name} exists`).toBeTruthy()
      const integration = { fetch: (path: string, init?: RequestInit) => proxy.call(sheetsNode, path, init) }
      const build = new Function('integration', `return (${tool!.handlerCode});`)
      return build(integration) as (input: any) => Promise<any>
    }

    buildWriteHandler = (name: string) => {
      const tool = tools!.write.find(t => t.name === name)
      expect(tool, `write tool ${name} exists`).toBeTruthy()
      const integration = { fetch: (path: string, init?: RequestInit) => proxy.call(sheetsNode, path, init) }
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

    // Create dedicated folder + spreadsheet for this run
    const create_folder = buildDriveWrite('create_folder')
    const folder = await create_folder({ name: `CmdTest Sheets ${Date.now()}` })
    folderId = folder?.id
    expect(folderId).toBeTruthy()

    const create_spreadsheet = buildWriteHandler('create_spreadsheet')
    const created = await create_spreadsheet({ properties: { title: `CmdTest Sheet ${Date.now()}` } })
    spreadsheetId = created?.spreadsheetId
    expect(spreadsheetId).toBeTruthy()

    const move_file = buildDriveWrite('move_file')
    await move_file({ fileId: spreadsheetId, addParents: folderId })

    try {
      const get_spreadsheet = buildReadHandler('get_spreadsheet')
      const meta = await get_spreadsheet({ spreadsheetId })
      sheetTitle = meta?.sheets?.[0]?.properties?.title
    }
    catch {}
  }, 60000)

  afterAll(async () => {
    if (!folderId)
      return
    try {
      if (spreadsheetId) {
        const delete_file = buildDriveWrite('delete_file')
        await delete_file({ fileId: spreadsheetId })
      }
    }
    catch {}
    try {
      const delete_file = buildDriveWrite('delete_file')
      await delete_file({ fileId: folderId })
    }
    catch {}
  }, 60000)

  it('get_spreadsheet returns metadata', async () => {
    if (!spreadsheetId)
      return expect(true).toBe(true)
    const handler = buildReadHandler('get_spreadsheet')
    const result = await handler({ spreadsheetId })
    expect(result?.spreadsheetId || result?.sheets).toBeTruthy()
  }, 30000)

  it('get_values returns a value range', async () => {
    if (!spreadsheetId)
      return expect(true).toBe(true)
    const handler = buildReadHandler('get_values')
    const range = sheetTitle ? `${sheetTitle}!A1:B5` : 'A1:B5'
    const result = await handler({ spreadsheetId, range })
    expect(result?.range || result?.values).toBeTruthy()
  }, 30000)

  it('batch_get_values returns multiple ranges', async () => {
    if (!spreadsheetId)
      return expect(true).toBe(true)
    const handler = buildReadHandler('batch_get_values')
    const aTitle = sheetTitle || 'Sheet1'
    const result = await handler({ spreadsheetId, ranges: [`${aTitle}!A1:A3`, `${aTitle}!B1:B3`] })
    expect(Array.isArray(result?.valueRanges)).toBe(true)
  }, 30000)

  it('get_spreadsheet_by_data_filter returns metadata', async () => {
    if (!spreadsheetId)
      return expect(true).toBe(true)
    const handler = buildReadHandler('get_spreadsheet_by_data_filter')
    const aTitle = sheetTitle || 'Sheet1'
    const result = await handler({ spreadsheetId, dataFilters: [{ a1Range: `${aTitle}!A1:A1` }] })
    expect(result?.spreadsheetId || result?.sheets).toBeTruthy()
  }, 30000)

  it('get_values_by_data_filter returns values', async () => {
    if (!spreadsheetId)
      return expect(true).toBe(true)
    const handler = buildReadHandler('get_values_by_data_filter')
    const aTitle = sheetTitle || 'Sheet1'
    const result = await handler({ spreadsheetId, dataFilters: [{ a1Range: `${aTitle}!A1:B2` }] })
    expect(Array.isArray(result?.valueRanges)).toBe(true)
  }, 30000)

  it('search_developer_metadata returns results or empty', async () => {
    if (!spreadsheetId)
      return expect(true).toBe(true)
    const handler = buildReadHandler('search_developer_metadata')
    const result = await handler({ spreadsheetId, dataFilters: [{ developerMetadataLookup: { visibility: 'DOCUMENT' } }] })
    expect(result !== undefined).toBe(true)
  }, 30000)

  it('get_developer_metadata retrieves by id when available', async () => {
    if (!spreadsheetId)
      return expect(true).toBe(true)
    const search = buildReadHandler('search_developer_metadata')
    const list = await search({ spreadsheetId, dataFilters: [{ developerMetadataLookup: { visibility: 'DOCUMENT' } }] })
    const first = list?.matchedDeveloperMetadata?.[0]?.developerMetadata || list?.developerMetadata?.[0]
    if (!first?.metadataId)
      return expect(true).toBe(true)
    const getdm = buildReadHandler('get_developer_metadata')
    const got = await getdm({ spreadsheetId, metadataId: first.metadataId })
    expect(got?.metadataId).toBe(first.metadataId)
  }, 30000)
})
