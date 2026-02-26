import { beforeAll, describe, expect, it } from 'vitest'
import { IntegrationProxy } from '../../../src/integrations/proxy.js'
import { loadIntegrationTools } from '../../../src/integrations/dataLoader.js'

// LIVE Google Sheets read tests using managed OAuth
// Required env vars:
// - COMMANDABLE_MANAGED_OAUTH_BASE_URL
// - COMMANDABLE_MANAGED_OAUTH_SECRET_KEY
// - GSHEETS_TEST_CONNECTION_ID (managed OAuth connection for provider 'google-sheet')
// - GSHEETS_TEST_SPREADSHEET_ID (an accessible spreadsheet ID)

describe('google-sheet read handlers (live)', () => {
  const env = process.env as Record<string, string>
  let buildReadHandler: (name: string) => ((input: any) => Promise<any>)
  let sheetTitle: string | undefined

  beforeAll(async () => {
    const { COMMANDABLE_MANAGED_OAUTH_BASE_URL, COMMANDABLE_MANAGED_OAUTH_SECRET_KEY, GSHEETS_TEST_CONNECTION_ID } = env

    if (!COMMANDABLE_MANAGED_OAUTH_BASE_URL || !COMMANDABLE_MANAGED_OAUTH_SECRET_KEY || !GSHEETS_TEST_CONNECTION_ID) {
      console.warn('Skipping live Google Sheets tests: missing required env vars')
      expect(false).toBe(true)
      return
    }

    const proxy = new IntegrationProxy({
      managedOAuthBaseUrl: COMMANDABLE_MANAGED_OAUTH_BASE_URL,
      managedOAuthSecretKey: COMMANDABLE_MANAGED_OAUTH_SECRET_KEY,
    })
    const integrationNode = { id: 'node-gsheets', type: 'google-sheet', label: 'Google Sheets', connectionId: GSHEETS_TEST_CONNECTION_ID } as any

    const tools = loadIntegrationTools('google-sheet')
    expect(tools).toBeTruthy()

    buildReadHandler = (name: string) => {
      const tool = tools!.read.find(t => t.name === name)
      expect(tool, `read tool ${name} exists`).toBeTruthy()
      const integration = { fetch: (path: string, init?: RequestInit) => proxy.call(integrationNode, path, init) }
      const build = new Function('integration', `return (${tool!.handlerCode});`)
      return build(integration) as (input: any) => Promise<any>
    }

    // Try to detect a default sheet title
    const spreadsheetId = env.GSHEETS_TEST_SPREADSHEET_ID
    if (spreadsheetId) {
      try {
        const get_spreadsheet = buildReadHandler('get_spreadsheet')
        const meta = await get_spreadsheet({ spreadsheetId })
        sheetTitle = meta?.sheets?.[0]?.properties?.title
      }
      catch {}
    }
  }, 60000)

  it('get_spreadsheet returns metadata', async () => {
    const spreadsheetId = env.GSHEETS_TEST_SPREADSHEET_ID
    if (!spreadsheetId)
      return expect(true).toBe(true)
    const handler = buildReadHandler('get_spreadsheet')
    const result = await handler({ spreadsheetId })
    expect(result?.spreadsheetId || result?.sheets).toBeTruthy()
  }, 30000)

  it('get_values returns a value range', async () => {
    const spreadsheetId = env.GSHEETS_TEST_SPREADSHEET_ID
    if (!spreadsheetId)
      return expect(true).toBe(true)
    const handler = buildReadHandler('get_values')
    const range = sheetTitle ? `${sheetTitle}!A1:B5` : 'A1:B5'
    const result = await handler({ spreadsheetId, range })
    expect(result?.range || result?.values).toBeTruthy()
  }, 30000)

  it('batch_get_values returns multiple ranges', async () => {
    const spreadsheetId = env.GSHEETS_TEST_SPREADSHEET_ID
    if (!spreadsheetId)
      return expect(true).toBe(true)
    const handler = buildReadHandler('batch_get_values')
    const aTitle = sheetTitle || 'Sheet1'
    const result = await handler({ spreadsheetId, ranges: [`${aTitle}!A1:A3`, `${aTitle}!B1:B3`] })
    expect(Array.isArray(result?.valueRanges)).toBe(true)
  }, 30000)

  it('get_spreadsheet_by_data_filter returns metadata', async () => {
    const spreadsheetId = env.GSHEETS_TEST_SPREADSHEET_ID
    if (!spreadsheetId)
      return expect(true).toBe(true)
    const handler = buildReadHandler('get_spreadsheet_by_data_filter')
    const aTitle = sheetTitle || 'Sheet1'
    const result = await handler({ spreadsheetId, dataFilters: [{ a1Range: `${aTitle}!A1:A1` }] })
    expect(result?.spreadsheetId || result?.sheets).toBeTruthy()
  }, 30000)

  it('get_values_by_data_filter returns values', async () => {
    const spreadsheetId = env.GSHEETS_TEST_SPREADSHEET_ID
    if (!spreadsheetId)
      return expect(true).toBe(true)
    const handler = buildReadHandler('get_values_by_data_filter')
    const aTitle = sheetTitle || 'Sheet1'
    const result = await handler({ spreadsheetId, dataFilters: [{ a1Range: `${aTitle}!A1:B2` }] })
    expect(Array.isArray(result?.valueRanges)).toBe(true)
  }, 30000)

  it('search_developer_metadata returns results or empty', async () => {
    const spreadsheetId = env.GSHEETS_TEST_SPREADSHEET_ID
    if (!spreadsheetId)
      return expect(true).toBe(true)
    const handler = buildReadHandler('search_developer_metadata')
    const result = await handler({ spreadsheetId, dataFilters: [{ developerMetadataLookup: { visibility: 'DOCUMENT' } }] })
    expect(result !== undefined).toBe(true)
  }, 30000)

  it('get_developer_metadata retrieves by id when available', async () => {
    const spreadsheetId = env.GSHEETS_TEST_SPREADSHEET_ID
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
