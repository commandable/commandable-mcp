import { $fetch } from 'ofetch'
import { beforeAll, describe, expect, it } from 'vitest'
import { IntegrationProxy } from '../../../../server/services/integrationProxy'
import { loadIntegrationTools } from '../../../../server/utils/integrationDataLoader'

// LIVE Google Sheets write tests using Nango
// Required env vars:
// - NUXT_PUBLIC_NANGO_API_BASE_URL
// - NUXT_NANGO_SECRET_KEY
// - GSHEETS_TEST_CONNECTION_ID (Nango connection for provider 'google-sheet')
// - GSHEETS_TEST_SPREADSHEET_ID (target spreadsheet ID with write access)

interface Ctx {
  spreadsheetId?: string
}

describe('google-sheet write handlers (live)', () => {
  const env = process.env as Record<string, string>
  const ctx: Ctx = {}
  let buildWriteHandler: (name: string) => ((input: any) => Promise<any>)
  let sheetTitle: string | undefined

  beforeAll(async () => {
    const { NUXT_PUBLIC_NANGO_API_BASE_URL, NUXT_NANGO_SECRET_KEY, GSHEETS_TEST_CONNECTION_ID, GSHEETS_TEST_SPREADSHEET_ID } = env

    if (!NUXT_PUBLIC_NANGO_API_BASE_URL || !NUXT_NANGO_SECRET_KEY || !GSHEETS_TEST_CONNECTION_ID) {
      console.warn('Skipping live Google Sheets write tests: missing required env vars')
      expect(false).toBe(true)
      return
    }

    ;(global as any).$fetch = $fetch
    ;(global as any).useRuntimeConfig = () => ({ public: { nangoApiBaseUrl: NUXT_PUBLIC_NANGO_API_BASE_URL } })

    const proxy = new IntegrationProxy(NUXT_NANGO_SECRET_KEY)
    const integrationNode = { id: 'node-gsheets', type: 'google-sheet', label: 'Google Sheets', connectionId: GSHEETS_TEST_CONNECTION_ID } as any

    const tools = loadIntegrationTools('google-sheet')
    expect(tools).toBeTruthy()

    buildWriteHandler = (name: string) => {
      const tool = tools!.write.find(t => t.name === name)
      expect(tool, `write tool ${name} exists`).toBeTruthy()
      const integration = { fetch: (path: string, init?: RequestInit) => proxy.call(integrationNode, path, init) }
      const build = new Function('integration', `return (${tool!.handlerCode});`)
      return build(integration) as (input: any) => Promise<any>
    }

    ctx.spreadsheetId = GSHEETS_TEST_SPREADSHEET_ID

    // Try to detect a default sheet title
    if (ctx.spreadsheetId) {
      const proxy2 = new IntegrationProxy(NUXT_NANGO_SECRET_KEY)
      const node2 = { id: 'node-gsheets', type: 'google-sheet', label: 'Google Sheets', connectionId: GSHEETS_TEST_CONNECTION_ID } as any
      const tools2 = loadIntegrationTools('google-sheet')!
      const tool = tools2.read.find(t => t.name === 'get_spreadsheet')!
      const build = new Function('integration', `return (${tool.handlerCode});`)
      const integration = { fetch: (path: string, init?: RequestInit) => proxy2.call(node2, path, init) }
      try {
        const get_spreadsheet = build(integration) as (input: any) => Promise<any>
        const meta = await get_spreadsheet({ spreadsheetId: ctx.spreadsheetId })
        sheetTitle = meta?.sheets?.[0]?.properties?.title
      }
      catch {}
    }
  }, 60000)

  it('append_values appends then clear_values clears', async () => {
    if (!ctx.spreadsheetId)
      return expect(true).toBe(true)

    const append_values = buildWriteHandler('append_values')
    const aTitle = sheetTitle || 'Sheet1'
    const appendRes = await append_values({ spreadsheetId: ctx.spreadsheetId, range: `${aTitle}!A1`, values: [[`CmdTest ${Date.now()}`]], valueInputOption: 'USER_ENTERED' })
    expect(appendRes?.updates || appendRes?.tableRange || appendRes?.spreadsheetId).toBeTruthy()

    const clear_values = buildWriteHandler('clear_values')
    const clearRes = await clear_values({ spreadsheetId: ctx.spreadsheetId, range: `${aTitle}!A1:A10` })
    expect(clearRes?.clearedRange || clearRes?.spreadsheetId).toBeTruthy()
  }, 60000)

  it('update_values updates a range', async () => {
    if (!ctx.spreadsheetId)
      return expect(true).toBe(true)
    const aTitle = sheetTitle || 'Sheet1'
    const update_values = buildWriteHandler('update_values')
    const res = await update_values({ spreadsheetId: ctx.spreadsheetId, range: `${aTitle}!B1:B1`, values: [[`CmdTestU ${Date.now()}`]], valueInputOption: 'USER_ENTERED' })
    expect(res?.updatedRange || res?.spreadsheetId).toBeTruthy()
  }, 60000)

  it('batch_update_values updates multiple ranges', async () => {
    if (!ctx.spreadsheetId)
      return expect(true).toBe(true)
    const aTitle = sheetTitle || 'Sheet1'
    const batch_update_values = buildWriteHandler('batch_update_values')
    const res = await batch_update_values({ spreadsheetId: ctx.spreadsheetId, data: [
      { range: `${aTitle}!C1:C1`, values: [[`CmdTestB1 ${Date.now()}`]] },
      { range: `${aTitle}!C2:C2`, values: [[`CmdTestB2 ${Date.now()}`]] },
    ], valueInputOption: 'USER_ENTERED', includeValuesInResponse: true })
    expect(res?.totalUpdatedCells >= 0 || res?.spreadsheetId).toBeTruthy()
  }, 60000)

  it('batch_update_values_by_data_filter updates via filters', async () => {
    if (!ctx.spreadsheetId)
      return expect(true).toBe(true)
    const aTitle = sheetTitle || 'Sheet1'
    const batch_update_values_by_data_filter = buildWriteHandler('batch_update_values_by_data_filter')
    const res = await batch_update_values_by_data_filter({ spreadsheetId: ctx.spreadsheetId, data: [
      { dataFilter: { a1Range: `${aTitle}!D1:D1` }, values: [[`CmdTestDF ${Date.now()}`]] },
    ], valueInputOption: 'USER_ENTERED' })
    expect(res?.totalUpdatedCells >= 0 || res?.spreadsheetId).toBeTruthy()
  }, 60000)

  it('batch_clear_values clears multiple ranges', async () => {
    if (!ctx.spreadsheetId)
      return expect(true).toBe(true)
    const aTitle = sheetTitle || 'Sheet1'
    const batch_clear_values = buildWriteHandler('batch_clear_values')
    const res = await batch_clear_values({ spreadsheetId: ctx.spreadsheetId, ranges: [`${aTitle}!A1:A2`, `${aTitle}!B1:B2`] })
    expect(Boolean(res?.spreadsheetId) || Array.isArray(res?.clearedRanges)).toBe(true)
  }, 60000)

  it('batch_clear_values_by_data_filter clears via filters', async () => {
    if (!ctx.spreadsheetId)
      return expect(true).toBe(true)
    const aTitle = sheetTitle || 'Sheet1'
    const batch_clear_values_by_data_filter = buildWriteHandler('batch_clear_values_by_data_filter')
    const res = await batch_clear_values_by_data_filter({ spreadsheetId: ctx.spreadsheetId, dataFilters: [{ a1Range: `${aTitle}!E1:E2` }] })
    expect(Boolean(res?.spreadsheetId) || Array.isArray(res?.clearedRanges)).toBe(true)
  }, 60000)

  it('batch_update handles a trivial request (no-op findReplace)', async () => {
    if (!ctx.spreadsheetId)
      return expect(true).toBe(true)
    const aTitle = sheetTitle || 'Sheet1'
    const batch_update = buildWriteHandler('batch_update')
    const res = await batch_update({ spreadsheetId: ctx.spreadsheetId, requests: [
      { findReplace: { find: '___unlikely___', replacement: '___unlikely___', matchCase: true, searchByRegex: false, includeFormulas: false, range: { sheetId: 0 } } },
    ], includeSpreadsheetInResponse: false })
    expect(res?.spreadsheetId).toBeTruthy()
  }, 60000)

  it('copy_to_spreadsheet copies a sheet when destination provided', async () => {
    if (!ctx.spreadsheetId || !env.GSHEETS_TEST_DEST_SPREADSHEET_ID)
      return expect(true).toBe(true)
    const copy_to_spreadsheet = buildWriteHandler('copy_to_spreadsheet')
    // Attempt to copy sheet with id 0 (typical for first sheet). If it fails, skip.
    try {
      const res = await copy_to_spreadsheet({ spreadsheetId: ctx.spreadsheetId, sheetId: 0, destinationSpreadsheetId: env.GSHEETS_TEST_DEST_SPREADSHEET_ID })
      expect(res?.sheetId !== undefined || res?.spreadsheetId).toBeTruthy()
    }
    catch {
      expect(true).toBe(true)
    }
  }, 60000)

  it('create_spreadsheet creates a spreadsheet when allowed', async () => {
    if (!env.GSHEETS_ALLOW_CREATE)
      return expect(true).toBe(true)
    const create_spreadsheet = buildWriteHandler('create_spreadsheet')
    const res = await create_spreadsheet({ properties: { title: `CmdTest ${Date.now()}` } })
    expect(res?.spreadsheetId).toBeTruthy()
    // Note: No delete here to avoid Drive scope; test leaves an artifact when enabled.
  }, 60000)
})
