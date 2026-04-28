import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createLiveRunId, createLiveToolCoverage, createLiveToolbox, createToolbox, hasEnv, safeCleanup } from '../../__tests__/liveHarness.js'
import { retryGoogleTemporaryIssues } from '../../__tests__/googleLiveRetry.js'
import { getPlanEntry } from '../../__tests__/liveCoveragePlan.js'

// LIVE Google Calendar read tests using credentials
// Required env vars:
// - Either GOOGLE_TOKEN, OR (GOOGLE_SERVICE_ACCOUNT_JSON + GOOGLE_IMPERSONATE_SUBJECT)

interface Ctx {
  calendarId?: string
  eventId?: string
  createdEventId?: string
}

const env = process.env as Record<string, string>
const suite = hasEnv(
  'GOOGLE_TOKEN',
)
  || hasEnv('GOOGLE_SERVICE_ACCOUNT_JSON', 'GOOGLE_IMPERSONATE_SUBJECT')
  ? describe
  : describe.skip

suite('google-calendar read handlers (live)', () => {
  const liveCoverage = createLiveToolCoverage(getPlanEntry('google-calendar-read'))
  const runId = createLiveRunId('gcal-read')

  afterAll(async () => {
    await safeCleanup(async () => {
      if (!ctx.calendarId || !ctx.createdEventId)
        return
      await calendar.write('delete_event')({ calendarId: ctx.calendarId, eventId: ctx.createdEventId })
    })
    liveCoverage.assertComplete()
  }, 60000)

  const ctx: Ctx = {}
  let calendar: ReturnType<typeof createToolbox>
  let buildHandler: (name: string) => ((input: any) => Promise<any>)

  beforeAll(async () => {
    calendar = createLiveToolbox({
      type: 'google-calendar',
      credentials: () => ({
        token: env.GOOGLE_TOKEN || '',
        serviceAccountJson: env.GOOGLE_SERVICE_ACCOUNT_JSON || '',
        subject: env.GOOGLE_IMPERSONATE_SUBJECT || '',
      }),
      label: 'Google Calendar',
      credentialId: 'google-calendar-creds',
      coverage: liveCoverage,
      retry: retryGoogleTemporaryIssues,
    }).toolbox

    buildHandler = (name: string) => calendar.read(name)

    const list_calendars = buildHandler('list_calendars')
    const calendars = await list_calendars({})
    ctx.calendarId = calendars?.calendars?.[0]?.id || 'primary'

    if (ctx.calendarId) {
      const list_events = buildHandler('list_events')
      const events = await list_events({ calendarId: ctx.calendarId, maxResults: 1, singleEvents: true, orderBy: 'startTime', timeMin: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString() })
      ctx.eventId = events?.events?.[0]?.id

      if (!ctx.eventId) {
        const now = new Date()
        const inOneHour = new Date(now.getTime() + 60 * 60 * 1000)
        const created = await calendar.write('create_event')({
          calendarId: ctx.calendarId,
          summary: `${runId} fixture`,
          start: { dateTime: now.toISOString() },
          end: { dateTime: inOneHour.toISOString() },
        })
        ctx.createdEventId = created?.id
        ctx.eventId = created?.id
      }
    }
  }, 60000)

  it('list_calendars returns calendars', async () => {
    const handler = buildHandler('list_calendars')
    const result = await handler({})
    expect(Array.isArray(result?.calendars)).toBe(true)
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
    expect(Array.isArray(result?.events)).toBe(true)
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
