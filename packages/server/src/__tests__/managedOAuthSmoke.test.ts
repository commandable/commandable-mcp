import { describe, expect, it } from 'vitest'
import { IntegrationProxy } from '../integrations/proxy.js'

const env = process.env as Record<string, string | undefined>

const has = (...keys: string[]) => keys.every(k => Boolean(env[k] && String(env[k]).trim().length > 0))

const suite = has('COMMANDABLE_MANAGED_OAUTH_BASE_URL', 'COMMANDABLE_MANAGED_OAUTH_SECRET_KEY')
  ? describe
  : describe.skip

suite('managed OAuth smoke (hosted-only)', () => {
  const proxy = new IntegrationProxy({
    managedOAuthBaseUrl: env.COMMANDABLE_MANAGED_OAUTH_BASE_URL,
    managedOAuthSecretKey: env.COMMANDABLE_MANAGED_OAUTH_SECRET_KEY,
    trelloApiKey: env.TRELLO_API_KEY,
  })

  it('GitHub /user works via managed OAuth', async () => {
    if (!has('GITHUB_TEST_CONNECTION_ID'))
      return expect(true).toBe(true)

    const resp = await proxy.call({
      id: 'github',
      referenceId: 'github',
      type: 'github',
      label: 'GitHub',
      connectionId: env.GITHUB_TEST_CONNECTION_ID!,
    } as any, '/user')

    expect(resp.ok).toBe(true)
  }, 30_000)

  it('Notion /users/me works via managed OAuth', async () => {
    if (!has('NOTION_TEST_CONNECTION_ID'))
      return expect(true).toBe(true)

    const resp = await proxy.call({
      id: 'notion',
      referenceId: 'notion',
      type: 'notion',
      label: 'Notion',
      connectionId: env.NOTION_TEST_CONNECTION_ID!,
    } as any, '/users/me')

    expect(resp.ok).toBe(true)
  }, 30_000)

  it('Airtable list bases works via managed OAuth', async () => {
    if (!has('AIRTABLE_TEST_CONNECTION_ID'))
      return expect(true).toBe(true)

    const resp = await proxy.call({
      id: 'airtable',
      referenceId: 'airtable',
      type: 'airtable',
      label: 'Airtable',
      connectionId: env.AIRTABLE_TEST_CONNECTION_ID!,
    } as any, '/meta/bases')

    expect(resp.ok).toBe(true)
  }, 30_000)

  it('Trello /members/me works via managed OAuth', async () => {
    if (!has('TRELLO_TEST_CONNECTION_ID', 'TRELLO_API_KEY'))
      return expect(true).toBe(true)

    const resp = await proxy.call({
      id: 'trello',
      referenceId: 'trello',
      type: 'trello',
      label: 'Trello',
      connectionId: env.TRELLO_TEST_CONNECTION_ID!,
    } as any, '/members/me')

    expect(resp.ok).toBe(true)
  }, 30_000)

  it('Google Calendar list calendars works via managed OAuth', async () => {
    if (!has('GCAL_TEST_CONNECTION_ID'))
      return expect(true).toBe(true)

    const resp = await proxy.call({
      id: 'google-calendar',
      referenceId: 'google-calendar',
      type: 'google-calendar',
      label: 'Google Calendar',
      connectionId: env.GCAL_TEST_CONNECTION_ID!,
    } as any, '/users/me/calendarList')

    expect(resp.ok).toBe(true)
  }, 30_000)

  it('Google Sheets get spreadsheet works via managed OAuth (optional)', async () => {
    if (!has('GSHEETS_TEST_CONNECTION_ID', 'GSHEETS_TEST_SPREADSHEET_ID'))
      return expect(true).toBe(true)

    const spreadsheetId = env.GSHEETS_TEST_SPREADSHEET_ID!
    const resp = await proxy.call({
      id: 'google-sheet',
      referenceId: 'google-sheet',
      type: 'google-sheet',
      label: 'Google Sheets',
      connectionId: env.GSHEETS_TEST_CONNECTION_ID!,
    } as any, `/spreadsheets/${encodeURIComponent(spreadsheetId)}`)

    expect(resp.ok).toBe(true)
  }, 30_000)

  it('Google Docs get document works via managed OAuth (optional)', async () => {
    if (!has('GDOCS_TEST_CONNECTION_ID', 'GDOCS_TEST_DOCUMENT_ID'))
      return expect(true).toBe(true)

    const documentId = env.GDOCS_TEST_DOCUMENT_ID!
    const resp = await proxy.call({
      id: 'google-docs',
      referenceId: 'google-docs',
      type: 'google-docs',
      label: 'Google Docs',
      connectionId: env.GDOCS_TEST_CONNECTION_ID!,
    } as any, `/documents/${encodeURIComponent(documentId)}`)

    expect(resp.ok).toBe(true)
  }, 30_000)

  it('Google Slides get presentation works via managed OAuth (optional)', async () => {
    if (!has('GSLIDES_TEST_CONNECTION_ID', 'GSLIDES_TEST_PRESENTATION_ID'))
      return expect(true).toBe(true)

    const presentationId = env.GSLIDES_TEST_PRESENTATION_ID!
    const resp = await proxy.call({
      id: 'google-slides',
      referenceId: 'google-slides',
      type: 'google-slides',
      label: 'Google Slides',
      connectionId: env.GSLIDES_TEST_CONNECTION_ID!,
    } as any, `/presentations/${encodeURIComponent(presentationId)}`)

    expect(resp.ok).toBe(true)
  }, 30_000)
})

