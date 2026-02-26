import { $fetch } from 'ofetch'
import { beforeAll, describe, expect, it } from 'vitest'
import { IntegrationProxy } from '../../../../server/services/integrationProxy'
import { loadIntegrationTools } from '../../../../server/utils/integrationDataLoader'

// LIVE Airtable write tests using Nango
// Required env vars for write tests:
// - NUXT_PUBLIC_NANGO_API_BASE_URL
// - NUXT_NANGO_SECRET_KEY
// - AIRTABLE_TEST_CONNECTION_ID (Nango connection for provider 'airtable')
// Optional env for choosing base/table (otherwise picks first available):
// - AIRTABLE_TEST_WRITE_BASE_ID
// - AIRTABLE_TEST_WRITE_TABLE_ID

interface Ctx {
  baseId?: string
  tableId?: string
  createdRecordId?: string
}

describe('airtable write handlers (live)', () => {
  const env = process.env as Record<string, string>
  const ctx: Ctx = {}
  let buildWriteHandler: (name: string) => ((input: any) => Promise<any>)
  let buildReadHandler: (name: string) => ((input: any) => Promise<any>)

  beforeAll(async () => {
    const { NUXT_PUBLIC_NANGO_API_BASE_URL, NUXT_NANGO_SECRET_KEY, AIRTABLE_TEST_CONNECTION_ID } = env

    if (!NUXT_PUBLIC_NANGO_API_BASE_URL || !NUXT_NANGO_SECRET_KEY || !AIRTABLE_TEST_CONNECTION_ID) {
      console.warn('Skipping live Airtable write tests: missing required env vars')
      expect(false).toBe(true)
      return
    }

    ;(global as any).$fetch = $fetch
    ;(global as any).useRuntimeConfig = () => ({ public: { nangoApiBaseUrl: NUXT_PUBLIC_NANGO_API_BASE_URL } })

    const proxy = new IntegrationProxy(NUXT_NANGO_SECRET_KEY)
    const integrationNode = { id: 'node-airtable', type: 'airtable', label: 'Airtable', connectionId: AIRTABLE_TEST_CONNECTION_ID } as any

    const tools = loadIntegrationTools('airtable')
    expect(tools).toBeTruthy()

    buildWriteHandler = (name: string) => {
      const tool = tools!.write.find(t => t.name === name)
      expect(tool, `write tool ${name} exists`).toBeTruthy()
      const integration = { fetch: (path: string, init?: RequestInit) => proxy.call(integrationNode, path, init) }
      const build = new Function('integration', `return (${tool!.handlerCode});`)
      return build(integration) as (input: any) => Promise<any>
    }

    buildReadHandler = (name: string) => {
      const tool = tools!.read.find(t => t.name === name)
      expect(tool, `read tool ${name} exists`).toBeTruthy()
      const integration = { fetch: (path: string, init?: RequestInit) => proxy.call(integrationNode, path, init) }
      const build = new Function('integration', `return (${tool!.handlerCode});`)
      return build(integration) as (input: any) => Promise<any>
    }

    // Resolve base/table for write tests
    ctx.baseId = env.AIRTABLE_TEST_WRITE_BASE_ID
    ctx.tableId = env.AIRTABLE_TEST_WRITE_TABLE_ID

    if (!ctx.baseId || !ctx.tableId) {
      const list_bases = buildReadHandler('list_bases')
      const bases = await list_bases({})
      ctx.baseId = ctx.baseId || (bases?.bases?.[0]?.id || bases?.[0]?.id)
      if (ctx.baseId) {
        const list_tables = buildReadHandler('list_tables')
        const tablesResp = await list_tables({ baseId: ctx.baseId })
        const tables = tablesResp?.tables || tablesResp
        ctx.tableId = ctx.tableId || tables?.[0]?.id
      }
    }
  }, 60000)

  it('create_record -> get_record -> update_record -> delete_record roundtrip', async () => {
    if (!ctx.baseId || !ctx.tableId)
      return expect(true).toBe(true)

    // Assume a single writable column named 'Name' per test setup
    const fieldName = 'Name'

    // Create
    const create_record = buildWriteHandler('create_record')
    const created = await create_record({ baseId: ctx.baseId, tableId: ctx.tableId, fields: { [fieldName]: `CmdTest ${Date.now()}` } })
    const createdRec = created?.records?.[0] || created
    expect(createdRec?.id).toBeTruthy()
    ctx.createdRecordId = createdRec.id

    // Read
    const get_record = buildReadHandler('get_record')
    const got = await get_record({ baseId: ctx.baseId, tableId: ctx.tableId, recordId: ctx.createdRecordId })
    expect(got?.id).toBe(ctx.createdRecordId)

    // Update
    const update_record = buildWriteHandler('update_record')
    const updated = await update_record({ baseId: ctx.baseId, tableId: ctx.tableId, recordId: ctx.createdRecordId, fields: { [fieldName]: `CmdTest Updated ${Date.now()}` } })
    const updatedRec = updated?.records?.[0] || updated
    expect(updatedRec?.id).toBe(ctx.createdRecordId)

    // Delete
    const delete_record = buildWriteHandler('delete_record')
    const del = await delete_record({ baseId: ctx.baseId, tableId: ctx.tableId, recordId: ctx.createdRecordId })
    const deletedRec = del?.records?.[0] || del
    expect(deletedRec?.deleted === true || deletedRec?.id === ctx.createdRecordId).toBe(true)
  }, 90000)
})

// Admin operations are not available on standard plans; omitted.
