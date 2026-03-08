import { beforeAll, describe, expect, it } from 'vitest'
import { IntegrationProxy } from '../../../../core/src/integrations/proxy.js'
import { loadIntegrationTools } from '../../../../core/src/integrations/dataLoader.js'

// LIVE Google Calendar write/admin tests using credentials
// Required env vars:
// - Either GOOGLE_TOKEN, OR (GOOGLE_SERVICE_ACCOUNT_JSON + GOOGLE_IMPERSONATE_SUBJECT)
// Optional:
// - GOOGLE_CALENDAR_TEST_CALENDAR_ID (defaults to 'primary')

interface Ctx {
  calendarId: string
  createdEventId?: string
  aclRuleId?: string
}

const env = process.env as Record<string, string>
const hasEnv = (...keys: string[]) => keys.every(k => !!env[k] && env[k].trim().length > 0)
const suite = hasEnv('GOOGLE_TOKEN') || hasEnv('GOOGLE_SERVICE_ACCOUNT_JSON', 'GOOGLE_IMPERSONATE_SUBJECT')
  ? describe
  : describe.skip

suite('google-calendar write & admin handlers (live)', () => {
  const ctx: Ctx = { calendarId: 'primary' }
  let buildWrite: (name: string) => ((input: any) => Promise<any>)
  let buildRead: (name: string) => ((input: any) => Promise<any>)
  let buildAdmin: (name: string) => ((input: any) => Promise<any>)

  beforeAll(async () => {
    const { GOOGLE_CALENDAR_TEST_CALENDAR_ID } = env

    ctx.calendarId = GOOGLE_CALENDAR_TEST_CALENDAR_ID || 'primary'

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

    buildWrite = (name: string) => {
      const tool = tools!.write.find(t => t.name === name)
      expect(tool, `write tool ${name} exists`).toBeTruthy()
      const integration = { fetch: (path: string, init?: RequestInit) => proxy.call(integrationNode, path, init) }
      const build = new Function('integration', `return (${tool!.handlerCode});`)
      return build(integration) as (input: any) => Promise<any>
    }

    buildRead = (name: string) => {
      const tool = tools!.read.find(t => t.name === name)
      expect(tool, `read tool ${name} exists`).toBeTruthy()
      const integration = { fetch: (path: string, init?: RequestInit) => proxy.call(integrationNode, path, init) }
      const build = new Function('integration', `return (${tool!.handlerCode});`)
      return build(integration) as (input: any) => Promise<any>
    }

    buildAdmin = (name: string) => {
      const tool = tools!.admin.find(t => t.name === name)
        || tools!.write.find(t => t.name === name)
        || tools!.read.find(t => t.name === name)
      expect(tool, `admin tool ${name} exists`).toBeTruthy()
      const integration = { fetch: (path: string, init?: RequestInit) => proxy.call(integrationNode, path, init) }
      const build = new Function('integration', `return (${tool!.handlerCode});`)
      return build(integration) as (input: any) => Promise<any>
    }
  }, 60000)

  it('create_event -> get_event -> patch_event -> delete_event', async () => {
    const now = new Date()
    const inOneHour = new Date(now.getTime() + 60 * 60 * 1000)
    const create_event = buildWrite('create_event')
    const created = await create_event({
      calendarId: ctx.calendarId,
      summary: `CmdTest ${Date.now()}`,
      start: { dateTime: now.toISOString() },
      end: { dateTime: inOneHour.toISOString() },
    })
    const createdId = created?.id
    expect(createdId).toBeTruthy()
    ctx.createdEventId = createdId

    const get_event = buildRead('get_event')
    const got = await get_event({ calendarId: ctx.calendarId, eventId: createdId })
    expect(got?.id).toBe(createdId)

    const patch_event = buildWrite('patch_event')
    const patched = await patch_event({ calendarId: ctx.calendarId, eventId: createdId, body: { summary: `CmdTest Updated ${Date.now()}` } })
    expect(patched?.id).toBe(createdId)

    const delete_event = buildWrite('delete_event')
    const del = await delete_event({ calendarId: ctx.calendarId, eventId: createdId })
    expect(del?.success === true || del === '').toBe(true)
  }, 90000)

  it('list_acl (admin) returns ACL rules', async () => {
    const list_acl = buildAdmin('list_acl')
    const acls = await list_acl({ calendarId: ctx.calendarId })
    expect(acls?.items).toBeTruthy()
  }, 30000)

  it('insert_acl -> get_acl -> update_acl -> delete_acl (admin)', async () => {
    if (!process.env.GOOGLE_CALENDAR_TEST_ADMIN_WRITE)
      return expect(true).toBe(true)
    const insert_acl = buildAdmin('insert_acl')
    const created = await insert_acl({ calendarId: ctx.calendarId, rule: { scope: { type: 'default' }, role: 'reader' } })
    const ruleId = created?.id
    expect(ruleId).toBeTruthy()
    const get_acl = buildAdmin('get_acl')
    const got = await get_acl({ calendarId: ctx.calendarId, ruleId })
    expect(got?.id).toBe(ruleId)
    const update_acl = buildAdmin('update_acl')
    const updated = await update_acl({ calendarId: ctx.calendarId, ruleId, rule: { scope: { type: 'default' }, role: 'owner' } })
    expect(updated?.id).toBe(ruleId)
    const delete_acl = buildAdmin('delete_acl')
    const del = await delete_acl({ calendarId: ctx.calendarId, ruleId })
    expect(del === '' || del?.success === true).toBe(true)
  }, 90000)

  it('quick_add creates a simple event', async () => {
    if (!process.env.GOOGLE_CALENDAR_TEST_QUICK_ADD)
      return expect(true).toBe(true)
    const quick_add = buildWrite('quick_add')
    const res = await quick_add({ calendarId: ctx.calendarId, text: `Lunch tomorrow ${Date.now()}` })
    expect(res?.id).toBeTruthy()
  }, 60000)

  it('move_event moves an event when provided a source event', async () => {
    if (!process.env.GOOGLE_CALENDAR_TEST_MOVE_DEST)
      return expect(true).toBe(true)
    const create_event = buildWrite('create_event')
    const now = new Date()
    const inOneHour = new Date(now.getTime() + 60 * 60 * 1000)
    const created = await create_event({ calendarId: ctx.calendarId, summary: `CmdTest Move ${Date.now()}`, start: { dateTime: now.toISOString() }, end: { dateTime: inOneHour.toISOString() } })
    const eventId = created?.id
    expect(eventId).toBeTruthy()
    const move_event = buildWrite('move_event')
    const moved = await move_event({ calendarId: ctx.calendarId, eventId, destinationId: process.env.GOOGLE_CALENDAR_TEST_MOVE_DEST })
    expect(moved?.id).toBeTruthy()
  }, 90000)
})
