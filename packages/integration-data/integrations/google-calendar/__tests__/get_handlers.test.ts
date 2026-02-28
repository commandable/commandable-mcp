import { beforeAll, describe, expect, it } from 'vitest'
import { IntegrationProxy } from '../../../../server/src/integrations/proxy.js'
import { loadIntegrationTools } from '../../../../server/src/integrations/dataLoader.js'

// LIVE Google Calendar read tests using credentials
// Required env vars:
// - Either GOOGLE_TOKEN, OR (GOOGLE_SERVICE_ACCOUNT_JSON + GOOGLE_IMPERSONATE_SUBJECT)

interface Ctx {
  calendarId?: string
  eventId?: string
}

const env = process.env as Record<string, string>
const hasEnv = (...keys: string[]) => keys.every(k => !!env[k] && env[k].trim().length > 0)
const suite = hasEnv(
  'GOOGLE_TOKEN',
)
  || hasEnv('GOOGLE_SERVICE_ACCOUNT_JSON', 'GOOGLE_IMPERSONATE_SUBJECT')
  ? describe
  : describe.skip

suite('google-calendar read handlers (live)', () => {
  const ctx: Ctx = {}
  let buildHandler: (name: string) => ((input: any) => Promise<any>)

  beforeAll(async () => {
    const credentialStore = {
      getCredentials: async () => ({
        token: env.GOOGLE_TOKEN || '',
        serviceAccountJson: env.GOOGLE_SERVICE_ACCOUNT_JSON || '',
        subject: env.GOOGLE_IMPERSONATE_SUBJECT || '',
      }),
    }

    const proxy = new IntegrationProxy({ credentialStore })
    const integrationNode = {
      spaceId: 'ci',
      id: 'node-gcal',
      referenceId: 'node-gcal',
      type: 'google-calendar',
      label: 'Google Calendar',
      connectionMethod: 'credentials',
      credentialId: 'google-calendar-creds',
    } as any

    const tools = loadIntegrationTools('google-calendar')
    expect(tools).toBeTruthy()

    buildHandler = (name: string) => {
      const tool = tools!.read.find(t => t.name === name)
      expect(tool, `tool ${name} exists`).toBeTruthy()
      const integration = { fetch: (path: string, init?: RequestInit) => proxy.call(integrationNode, path, init) }
      const build = new Function('integration', `return (${tool!.handlerCode});`)
      return build(integration) as (input: any) => Promise<any>
    }

    const list_calendars = buildHandler('list_calendars')
    const calendars = await list_calendars({})
    ctx.calendarId = calendars?.items?.[0]?.id || 'primary'

    if (ctx.calendarId) {
      const list_events = buildHandler('list_events')
      const events = await list_events({ calendarId: ctx.calendarId, maxResults: 1, singleEvents: true, orderBy: 'startTime', timeMin: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString() })
      ctx.eventId = events?.items?.[0]?.id
    }
  }, 60000)

  it('list_calendars returns calendars', async () => {
    const handler = buildHandler('list_calendars')
    const result = await handler({})
    expect(result).toBeTruthy()
  }, 30000)

  it('get_calendar returns a calendar', async () => {
    const handler = buildHandler('get_calendar')
    const result = await handler({ calendarId: ctx.calendarId || 'primary' })
    expect(result?.id).toBeTruthy()
  }, 30000)

  it('list_events returns events', async () => {
    if (!ctx.calendarId)
      return expect(true).toBe(true)
    const handler = buildHandler('list_events')
    const result = await handler({ calendarId: ctx.calendarId, maxResults: 3, singleEvents: true })
    expect(result).toBeTruthy()
  }, 30000)

  it('get_event returns an event by id when available', async () => {
    if (!ctx.calendarId || !ctx.eventId)
      return expect(true).toBe(true)
    const handler = buildHandler('get_event')
    const result = await handler({ calendarId: ctx.calendarId, eventId: ctx.eventId })
    expect(result?.id).toBe(ctx.eventId)
  }, 30000)

  it('list_colors returns colors', async () => {
    const handler = buildHandler('list_colors')
    const result = await handler({})
    expect(result?.calendar || result?.event).toBeTruthy()
  }, 30000)

  it('list_settings returns user settings', async () => {
    const handler = buildHandler('list_settings')
    const result = await handler({})
    expect(Array.isArray(result?.items) || result?.kind === 'calendar#settings').toBe(true)
  }, 30000)

  it('freebusy_query returns availability', async () => {
    const handler = buildHandler('freebusy_query')
    const now = new Date()
    const inOneHour = new Date(now.getTime() + 60 * 60 * 1000)
    const result = await handler({
      timeMin: now.toISOString(),
      timeMax: inOneHour.toISOString(),
      items: [{ id: ctx.calendarId || 'primary' }],
    })
    expect(result?.calendars || result?.groups).toBeTruthy()
  }, 30000)
})
