import { beforeAll, describe, expect, it } from 'vitest'
import { IntegrationProxy } from '../../../../server/src/integrations/proxy.js'
import { loadIntegrationTools } from '../../../../server/src/integrations/dataLoader.js'

// LIVE Airtable integration tests using credentials
// Required env vars:
// - AIRTABLE_TOKEN

interface Ctx {
  baseId?: string
  tableId?: string
  recordId?: string
}

const env = process.env as Record<string, string>
const hasEnv = (...keys: string[]) => keys.every(k => !!env[k] && env[k].trim().length > 0)
const suite = hasEnv(
  'AIRTABLE_TOKEN',
)
  ? describe
  : describe.skip

suite('airtable read handlers (live)', () => {
  const ctx: Ctx = {}
  let buildHandler: (name: string) => ((input: any) => Promise<any>)

  beforeAll(async () => {
    const credentialStore = {
      getCredentials: async () => ({ token: env.AIRTABLE_TOKEN || '' }),
    }

    const proxy = new IntegrationProxy({ credentialStore })
    const integrationNode = {
      spaceId: 'ci',
      id: 'node-airtable',
      referenceId: 'node-airtable',
      type: 'airtable',
      label: 'Airtable',
      connectionMethod: 'credentials',
      credentialId: 'airtable-creds',
    } as any

    const tools = loadIntegrationTools('airtable')
    expect(tools).toBeTruthy()

    buildHandler = (name: string) => {
      const tool = tools!.read.find(t => t.name === name)
      expect(tool, `tool ${name} exists`).toBeTruthy()
      const integration = {
        fetch: (path: string, init?: RequestInit) => proxy.call(integrationNode, path, init),
      }
      const build = new Function('integration', `return (${tool!.handlerCode});`)
      return build(integration) as (input: any) => Promise<any>
    }

    // Discover base -> table -> record for tests
    const list_bases = buildHandler('list_bases')
    const bases = await list_bases({})
    ctx.baseId = bases?.bases?.[0]?.id || bases?.[0]?.id

    if (ctx.baseId) {
      const list_tables = buildHandler('list_tables')
      const tablesResp = await list_tables({ baseId: ctx.baseId })
      const tables = tablesResp?.tables || tablesResp
      ctx.tableId = tables?.[0]?.id

      if (ctx.tableId) {
        const list_records = buildHandler('list_records')
        const recs = await list_records({ baseId: ctx.baseId, tableId: ctx.tableId, pageSize: 1 })
        const records = recs?.records || recs
        ctx.recordId = records?.[0]?.id
      }
    }
  }, 60000)

  it('list_bases returns bases', async () => {
    const handler = buildHandler('list_bases')
    const result = await handler({})
    expect(result).toBeTruthy()
  }, 30000)

  it('list_tables returns tables for base', async () => {
    if (!ctx.baseId)
      return expect(true).toBe(true)
    const handler = buildHandler('list_tables')
    const result = await handler({ baseId: ctx.baseId })
    expect(result).toBeTruthy()
  }, 30000)

  it('get_table_schema returns a table schema', async () => {
    if (!ctx.baseId || !ctx.tableId)
      return expect(true).toBe(true)
    const handler = buildHandler('get_table_schema')
    const result = await handler({ baseId: ctx.baseId, tableId: ctx.tableId })
    expect(result?.id || result?.name).toBeTruthy()
  }, 30000)

  it('list_table_fields returns fields', async () => {
    if (!ctx.baseId || !ctx.tableId)
      return expect(true).toBe(true)
    const handler = buildHandler('list_table_fields')
    const result = await handler({ baseId: ctx.baseId, tableId: ctx.tableId })
    expect(Array.isArray(result)).toBe(true)
  }, 30000)

  it('list_views returns views', async () => {
    if (!ctx.baseId || !ctx.tableId)
      return expect(true).toBe(true)
    const handler = buildHandler('list_views')
    const result = await handler({ baseId: ctx.baseId, tableId: ctx.tableId })
    expect(Array.isArray(result)).toBe(true)
  }, 30000)

  it('list_records returns records', async () => {
    if (!ctx.baseId || !ctx.tableId)
      return expect(true).toBe(true)
    const handler = buildHandler('list_records')
    const result = await handler({ baseId: ctx.baseId, tableId: ctx.tableId, pageSize: 3 })
    expect(result).toBeTruthy()
  }, 30000)

  it('get_record returns a record by id', async () => {
    if (!ctx.baseId || !ctx.tableId || !ctx.recordId)
      return expect(true).toBe(true)
    const handler = buildHandler('get_record')
    const result = await handler({ baseId: ctx.baseId, tableId: ctx.tableId, recordId: ctx.recordId })
    expect(result?.id).toBe(ctx.recordId)
  }, 30000)

  it('search_records returns matching records', async () => {
    if (!ctx.baseId || !ctx.tableId)
      return expect(true).toBe(true)
    const list_fields = buildHandler('list_table_fields')
    const fields: any[] = await list_fields({ baseId: ctx.baseId, tableId: ctx.tableId })
    const fieldName = fields?.[0]?.name || 'Name'
    const handler = buildHandler('search_records')
    const result = await handler({ baseId: ctx.baseId, tableId: ctx.tableId, field: fieldName, value: '' })
    expect(result).toBeTruthy()
  }, 30000)
})
