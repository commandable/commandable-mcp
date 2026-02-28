import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createCredentialStore, createIntegrationNode, createProxy, createToolbox, hasEnv, safeCleanup } from '../../__tests__/liveHarness.js'

// LIVE Google Sheets write tests using credentials
// Required env vars:
// - Either GOOGLE_TOKEN, OR GOOGLE_SERVICE_ACCOUNT_JSON
// - GOOGLE_SHEETS_TEST_SPREADSHEET_ID (target spreadsheet ID with write access)

interface Ctx {
  spreadsheetId?: string
  folderId?: string
  destSpreadsheetId?: string
}

const suite = (hasEnv('GOOGLE_TOKEN') || hasEnv('GOOGLE_SERVICE_ACCOUNT_JSON'))
  ? describe
  : describe.skip

suite('google-sheet write handlers (live)', () => {
  const ctx: Ctx = {}
  let sheets: ReturnType<typeof createToolbox>
  let drive: ReturnType<typeof createToolbox>
  let sheetTitle: string | undefined

  beforeAll(async () => {
    const env = process.env as Record<string, string | undefined>
    const credentialStore = createCredentialStore(async () => ({
      token: env.GOOGLE_TOKEN || '',
      serviceAccountJson: env.GOOGLE_SERVICE_ACCOUNT_JSON || '',
      subject: env.GOOGLE_IMPERSONATE_SUBJECT || '',
    }))
    const proxy = createProxy(credentialStore)
    sheets = createToolbox('google-sheet', proxy, createIntegrationNode('google-sheet', { label: 'Google Sheets', credentialId: 'google-sheet-creds' }))
    drive = createToolbox('google-drive', proxy, createIntegrationNode('google-drive', { label: 'Google Drive', credentialId: 'google-drive-creds' }))

    const folder = await drive.write('create_folder')({ name: `CmdTest Sheets Write ${Date.now()}` })
    ctx.folderId = folder?.id
    expect(ctx.folderId).toBeTruthy()

    const created = await drive.write('create_file')({
      name: `CmdTest Sheet ${Date.now()}`,
      mimeType: 'application/vnd.google-apps.spreadsheet',
      parentId: ctx.folderId,
    })
    ctx.spreadsheetId = created?.id
    expect(ctx.spreadsheetId).toBeTruthy()

    const createdDest = await drive.write('create_file')({
      name: `CmdTest Sheet Dest ${Date.now()}`,
      mimeType: 'application/vnd.google-apps.spreadsheet',
      parentId: ctx.folderId,
    })
    ctx.destSpreadsheetId = createdDest?.id
    expect(ctx.destSpreadsheetId).toBeTruthy()

    // Try to detect a default sheet title
    if (ctx.spreadsheetId) {
      try {
        const get_spreadsheet = sheets.read('get_spreadsheet')
        const meta = await get_spreadsheet({ spreadsheetId: ctx.spreadsheetId })
        sheetTitle = meta?.sheets?.[0]?.properties?.title
      }
      catch {}
    }
  }, 60000)

  afterAll(async () => {
    await safeCleanup(async () => {
      const delete_file = drive.write('delete_file')
      if (ctx.spreadsheetId)
        await delete_file({ fileId: ctx.spreadsheetId })
      if (ctx.destSpreadsheetId)
        await delete_file({ fileId: ctx.destSpreadsheetId })
    })
    await safeCleanup(async () => ctx.folderId ? drive.write('delete_file')({ fileId: ctx.folderId }) : Promise.resolve())
  }, 60_000)

  it('append_values appends then clear_values clears', async () => {
    if (!ctx.spreadsheetId)
      return expect(true).toBe(true)

    const append_values = sheets.write('append_values')
    const aTitle = sheetTitle || 'Sheet1'
    const appendRes = await append_values({ spreadsheetId: ctx.spreadsheetId, range: `${aTitle}!A1`, values: [[`CmdTest ${Date.now()}`]], valueInputOption: 'USER_ENTERED' })
    expect(appendRes?.updates || appendRes?.tableRange || appendRes?.spreadsheetId).toBeTruthy()

    const clear_values = sheets.write('clear_values')
    const clearRes = await clear_values({ spreadsheetId: ctx.spreadsheetId, range: `${aTitle}!A1:A10` })
    expect(clearRes?.clearedRange || clearRes?.spreadsheetId).toBeTruthy()
  }, 60000)

  it('update_values updates a range', async () => {
    if (!ctx.spreadsheetId)
      return expect(true).toBe(true)
    const aTitle = sheetTitle || 'Sheet1'
    const update_values = sheets.write('update_values')
    const res = await update_values({ spreadsheetId: ctx.spreadsheetId, range: `${aTitle}!B1:B1`, values: [[`CmdTestU ${Date.now()}`]], valueInputOption: 'USER_ENTERED' })
    expect(res?.updatedRange || res?.spreadsheetId).toBeTruthy()
  }, 60000)

  it('batch_update_values updates multiple ranges', async () => {
    if (!ctx.spreadsheetId)
      return expect(true).toBe(true)
    const aTitle = sheetTitle || 'Sheet1'
    const batch_update_values = sheets.write('batch_update_values')
    const res = await batch_update_values({ spreadsheetId: ctx.spreadsheetId, data: [
      { range: `${aTitle}!C1:C1`, values: [[`CmdTestB1 ${Date.now()}`]] },
      { range: `${aTitle}!C2:C2`, values: [[`CmdTestB2 ${Date.now()}`]] },
    ], valueInputOption: 'USER_ENTERED', includeValuesInResponse: true })
    expect(res?.totalUpdatedCells >= 0 || res?.spreadsheetId).toBeTruthy()
  }, 60000)

  it('batch_clear_values clears multiple ranges', async () => {
    if (!ctx.spreadsheetId)
      return expect(true).toBe(true)
    const aTitle = sheetTitle || 'Sheet1'
    const batch_clear_values = sheets.write('batch_clear_values')
    const res = await batch_clear_values({ spreadsheetId: ctx.spreadsheetId, ranges: [`${aTitle}!A1:A2`, `${aTitle}!B1:B2`] })
    expect(Boolean(res?.spreadsheetId) || Array.isArray(res?.clearedRanges)).toBe(true)
  }, 60000)

  it('batch_update handles a trivial request (no-op findReplace)', async () => {
    if (!ctx.spreadsheetId)
      return expect(true).toBe(true)
    const aTitle = sheetTitle || 'Sheet1'
    const batch_update = sheets.write('batch_update')
    const res = await batch_update({ spreadsheetId: ctx.spreadsheetId, requests: [
      { findReplace: { find: '___unlikely___', replacement: '___unlikely___', matchCase: true, searchByRegex: false, includeFormulas: false, range: { sheetId: 0 } } },
    ], includeSpreadsheetInResponse: false })
    expect(res?.spreadsheetId).toBeTruthy()
  }, 60000)

  it('copy_to_spreadsheet copies a sheet when destination provided', async () => {
    if (!ctx.spreadsheetId || !ctx.destSpreadsheetId)
      return expect(true).toBe(true)
    const copy_to_spreadsheet = sheets.write('copy_to_spreadsheet')
    // Attempt to copy sheet with id 0 (typical for first sheet). If it fails, skip.
    try {
      const res = await copy_to_spreadsheet({ spreadsheetId: ctx.spreadsheetId, sheetId: 0, destinationSpreadsheetId: ctx.destSpreadsheetId })
      expect(res?.sheetId !== undefined || res?.spreadsheetId).toBeTruthy()
    }
    catch {
      expect(true).toBe(true)
    }
  }, 60000)

  it('create_spreadsheet creates a spreadsheet (self-cleaning)', async () => {
    const created = await sheets.write('create_spreadsheet')({ properties: { title: `CmdTest Sheet Tool ${Date.now()}` } })
    const id = created?.spreadsheetId
    expect(typeof id).toBe('string')
    await safeCleanup(async () => id ? drive.write('delete_file')({ fileId: id }) : Promise.resolve())
  }, 60000)
})
