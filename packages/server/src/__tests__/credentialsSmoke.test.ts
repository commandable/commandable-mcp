import { describe, expect, it } from 'vitest'
import { IntegrationProxy } from '../integrations/proxy.js'

const env = process.env as Record<string, string | undefined>

const hasAll = (keys: string[]) => keys.every(k => !!env[k] && String(env[k]).trim().length > 0)

const required = [
  'TRELLO_API_KEY',
  'TRELLO_API_TOKEN',
  'GOOGLE_SERVICE_ACCOUNT_JSON',
  'GOOGLE_SHEETS_TEST_SPREADSHEET_ID',
]

const suite = hasAll(required) ? describe : describe.skip

suite('credentials smoke (live)', () => {
  const credentialStore = {
    getCredentials: async (_spaceId: string, credentialId: string) => {
      if (credentialId === 'github-creds')
        return { token: env.GITHUB_TOKEN || '' }
      if (credentialId === 'trello-creds')
        return { apiKey: env.TRELLO_API_KEY || '', apiToken: env.TRELLO_API_TOKEN || '' }
      if (credentialId === 'google-sheet-creds')
        return { serviceAccountJson: env.GOOGLE_SERVICE_ACCOUNT_JSON || '' }
      return null
    },
  }

  const proxy = new IntegrationProxy({ credentialStore })

  it('GitHub /user works with credentials token', async () => {
    if (!env.GITHUB_TOKEN)
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

  it('Trello /members/me works with credentials query params', async () => {
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
})

