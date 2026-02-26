import { describe, expect, it } from 'vitest'
import { IntegrationProxy } from '../integrations/proxy.js'

const env = process.env as Record<string, string | undefined>

const has = (...keys: string[]) => keys.every(k => !!env[k] && String(env[k]).trim().length > 0)

describe('credentials smoke (live)', () => {
  const credentialStore = {
    getCredentials: async (_spaceId: string, credentialId: string) => {
      if (credentialId === 'github-creds')
        return { token: env.GITHUB_TOKEN || '' }
      if (credentialId === 'airtable-creds')
        return { token: env.AIRTABLE_TOKEN || '' }
      if (credentialId === 'notion-creds')
        return { token: env.NOTION_TOKEN || '' }
      if (credentialId === 'trello-creds')
        return { apiKey: env.TRELLO_API_KEY || '', apiToken: env.TRELLO_API_TOKEN || '' }
      if (credentialId === 'google-sheet-creds')
        return { serviceAccountJson: env.GOOGLE_SERVICE_ACCOUNT_JSON || '' }
      if (credentialId === 'google-docs-creds')
        return { serviceAccountJson: env.GOOGLE_SERVICE_ACCOUNT_JSON || '' }
      if (credentialId === 'google-slides-creds')
        return { serviceAccountJson: env.GOOGLE_SERVICE_ACCOUNT_JSON || '' }
      if (credentialId === 'google-calendar-creds')
        return { serviceAccountJson: env.GOOGLE_SERVICE_ACCOUNT_JSON || '', subject: env.GOOGLE_IMPERSONATE_SUBJECT || '' }
      return null
    },
  }

  const proxy = new IntegrationProxy({ credentialStore })

  it('GitHub /user works with credentials token', async () => {
    if (!has('GITHUB_TOKEN'))
      return expect(true).toBe(true)

    const resp = await proxy.call({
      spaceId: 'ci',
      id: 'github',
      referenceId: 'github',
      type: 'github',
      label: 'GitHub',
      connectionMethod: 'credentials',
      credentialId: 'github-creds',
    }, '/user')

    expect(resp.ok).toBe(true)
    const json: any = await resp.json()
    expect(json).toBeTruthy()
  }, 30_000)

  it('Airtable list_bases works with credentials token', async () => {
    if (!has('AIRTABLE_TOKEN'))
      return expect(true).toBe(true)

    const resp = await proxy.call({
      spaceId: 'ci',
      id: 'airtable',
      referenceId: 'airtable',
      type: 'airtable',
      label: 'Airtable',
      connectionMethod: 'credentials',
      credentialId: 'airtable-creds',
    }, '/meta/bases')

    expect(resp.ok).toBe(true)
    const json: any = await resp.json()
    expect(json).toBeTruthy()
  }, 30_000)

  it('Notion /users/me works with credentials token', async () => {
    if (!has('NOTION_TOKEN'))
      return expect(true).toBe(true)

    const resp = await proxy.call({
      spaceId: 'ci',
      id: 'notion',
      referenceId: 'notion',
      type: 'notion',
      label: 'Notion',
      connectionMethod: 'credentials',
      credentialId: 'notion-creds',
    }, '/users/me')

    expect(resp.ok).toBe(true)
    const json: any = await resp.json()
    expect(json).toBeTruthy()
  }, 30_000)

  it('Trello /members/me works with credentials query params', async () => {
    if (!has('TRELLO_API_KEY', 'TRELLO_API_TOKEN'))
      return expect(true).toBe(true)

    const resp = await proxy.call({
      spaceId: 'ci',
      id: 'trello',
      referenceId: 'trello',
      type: 'trello',
      label: 'Trello',
      connectionMethod: 'credentials',
      credentialId: 'trello-creds',
    }, '/members/me')

    expect(resp.ok).toBe(true)
    const json: any = await resp.json()
    expect(json).toBeTruthy()
  }, 30_000)

  it('Google Sheets get_spreadsheet works with service account', async () => {
    if (!has('GOOGLE_SERVICE_ACCOUNT_JSON', 'GOOGLE_SHEETS_TEST_SPREADSHEET_ID'))
      return expect(true).toBe(true)

    const spreadsheetId = env.GOOGLE_SHEETS_TEST_SPREADSHEET_ID!
    const resp = await proxy.call({
      spaceId: 'ci',
      id: 'google-sheet',
      referenceId: 'google-sheet',
      type: 'google-sheet',
      label: 'Google Sheets',
      connectionMethod: 'credentials',
      credentialId: 'google-sheet-creds',
    }, `/spreadsheets/${encodeURIComponent(spreadsheetId)}`)

    expect(resp.ok).toBe(true)
    const json: any = await resp.json()
    expect(json?.spreadsheetId).toBeTruthy()
  }, 30_000)

  it('Google Docs get_document works with service account (optional)', async () => {
    if (!has('GOOGLE_SERVICE_ACCOUNT_JSON', 'GOOGLE_DOCS_TEST_DOCUMENT_ID'))
      return expect(true).toBe(true)

    const documentId = env.GOOGLE_DOCS_TEST_DOCUMENT_ID!
    const resp = await proxy.call({
      spaceId: 'ci',
      id: 'google-docs',
      referenceId: 'google-docs',
      type: 'google-docs',
      label: 'Google Docs',
      connectionMethod: 'credentials',
      credentialId: 'google-docs-creds',
    }, `/documents/${encodeURIComponent(documentId)}`)

    expect(resp.ok).toBe(true)
    const json: any = await resp.json()
    expect(json?.documentId).toBeTruthy()
  }, 30_000)

  it('Google Slides get_presentation works with service account (optional)', async () => {
    if (!has('GOOGLE_SERVICE_ACCOUNT_JSON', 'GOOGLE_SLIDES_TEST_PRESENTATION_ID'))
      return expect(true).toBe(true)

    const presentationId = env.GOOGLE_SLIDES_TEST_PRESENTATION_ID!
    const resp = await proxy.call({
      spaceId: 'ci',
      id: 'google-slides',
      referenceId: 'google-slides',
      type: 'google-slides',
      label: 'Google Slides',
      connectionMethod: 'credentials',
      credentialId: 'google-slides-creds',
    }, `/presentations/${encodeURIComponent(presentationId)}`)

    expect(resp.ok).toBe(true)
    const json: any = await resp.json()
    expect(json?.presentationId).toBeTruthy()
  }, 30_000)

  it('Google Calendar list_calendars works with service account impersonation (optional)', async () => {
    if (!has('GOOGLE_SERVICE_ACCOUNT_JSON', 'GOOGLE_IMPERSONATE_SUBJECT'))
      return expect(true).toBe(true)

    const resp = await proxy.call({
      spaceId: 'ci',
      id: 'google-calendar',
      referenceId: 'google-calendar',
      type: 'google-calendar',
      label: 'Google Calendar',
      connectionMethod: 'credentials',
      credentialId: 'google-calendar-creds',
    }, '/users/me/calendarList')

    expect(resp.ok).toBe(true)
    const json: any = await resp.json()
    expect(json).toBeTruthy()
  }, 30_000)
})

