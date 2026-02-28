import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createCredentialStore, createIntegrationNode, createProxy, createToolbox, hasEnv, safeCleanup } from '../../__tests__/liveHarness.js'

// LIVE Google Sheets read tests using credentials
// Required env vars:
// - Either GOOGLE_TOKEN, OR GOOGLE_SERVICE_ACCOUNT_JSON

const suite = (hasEnv('GOOGLE_TOKEN') || hasEnv('GOOGLE_SERVICE_ACCOUNT_JSON'))
  ? describe
  : describe.skip

suite('google-sheet read handlers (live)', () => {
  let sheets: ReturnType<typeof createToolbox>
  let drive: ReturnType<typeof createToolbox>
  let sheetTitle: string | undefined
  let folderId: string | undefined
  let spreadsheetId: string | undefined

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

    // Create dedicated folder + spreadsheet for this run
    const folder = await drive.write('create_folder')({ name: `CmdTest Sheets ${Date.now()}` })
    folderId = folder?.id
    expect(folderId).toBeTruthy()

    const created = await drive.write('create_file')({
      name: `CmdTest Sheet ${Date.now()}`,
      mimeType: 'application/vnd.google-apps.spreadsheet',
      parentId: folderId,
    })
    spreadsheetId = created?.id
    expect(spreadsheetId).toBeTruthy()

    try {
      const get_spreadsheet = sheets.read('get_spreadsheet')
      const meta = await get_spreadsheet({ spreadsheetId })
      sheetTitle = meta?.sheets?.[0]?.properties?.title
    }
    catch {}
  }, 60000)

  afterAll(async () => {
    if (!folderId)
      return
    await safeCleanup(async () => spreadsheetId ? drive.write('delete_file')({ fileId: spreadsheetId }) : Promise.resolve())
    await safeCleanup(async () => drive.write('delete_file')({ fileId: folderId }))
  }, 60000)

  it('get_spreadsheet returns metadata', async () => {
    if (!spreadsheetId)
      return expect(true).toBe(true)
    const handler = sheets.read('get_spreadsheet')
    const result = await handler({ spreadsheetId })
    expect(result?.spreadsheetId || result?.sheets).toBeTruthy()
  }, 30000)

  it('read_sheet returns markdown with A1 coordinates', async () => {
    if (!spreadsheetId)
      return expect(true).toBe(true)
    const handler = sheets.read('read_sheet')
    const range = sheetTitle ? `${sheetTitle}!A1:B5` : 'A1:B5'
    const result = await handler({ spreadsheetId, range, valueRenderOption: 'FORMATTED_VALUE' })
    expect(result?.range).toBeTruthy()
    expect(typeof result?.markdown).toBe('string')
    expect(result?.columnCount >= 1).toBe(true)
  }, 30000)
})
