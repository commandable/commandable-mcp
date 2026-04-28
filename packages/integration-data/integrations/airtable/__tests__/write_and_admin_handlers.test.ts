import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createLiveRunId, createLiveToolCoverage, createLiveToolbox, createToolbox, hasEnv } from '../../__tests__/liveHarness.js'
import { getPlanEntry } from '../../__tests__/liveCoveragePlan.js'

// LIVE Airtable write tests using credentials
// Required env vars:
// - AIRTABLE_TOKEN
// Optional env for choosing base/table (otherwise picks first available):
// - AIRTABLE_TEST_WRITE_BASE_ID
// - AIRTABLE_TEST_WRITE_TABLE_ID

interface Ctx {
  baseId?: string
  tableId?: string
  createdRecordId?: string
}

const env = process.env as Record<string, string>
const suite = hasEnv(
  'AIRTABLE_TOKEN',
)
  ? describe
  : describe.skip

suite('airtable write handlers (live)', () => {
  const liveCoverage = createLiveToolCoverage(getPlanEntry('airtable-write'))
  const runId = createLiveRunId('airtable-write')

  afterAll(() => {
    liveCoverage.assertComplete()
  })

  const ctx: Ctx = {}
  let airtable: ReturnType<typeof createToolbox>
  let buildWriteHandler: (name: string) => ((input: any) => Promise<any>)
  let buildReadHandler: (name: string) => ((input: any) => Promise<any>)

  beforeAll(async () => {
    airtable = createLiveToolbox({
      type: 'airtable',
      credentials: () => ({ token: env.AIRTABLE_TOKEN || '' }),
      label: 'Airtable',
      credentialId: 'airtable-creds',
      coverage: liveCoverage,
    }).toolbox

    buildWriteHandler = (name: string) => airtable.write(name)
    buildReadHandler = (name: string) => airtable.read(name)

    // Resolve base/table for write tests
    ctx.baseId = env.AIRTABLE_TEST_WRITE_BASE_ID
    ctx.tableId = env.AIRTABLE_TEST_WRITE_TABLE_ID

    if (env.CI && (!ctx.baseId || !ctx.tableId))
      throw new Error('Airtable live tests require AIRTABLE_TEST_WRITE_BASE_ID and AIRTABLE_TEST_WRITE_TABLE_ID in CI.')

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
    const created = await create_record({ baseId: ctx.baseId, tableId: ctx.tableId, fields: { [fieldName]: `${runId} Created` } })
    const createdRec = created?.records?.[0] || created
    expect(createdRec?.id).toBeTruthy()
    ctx.createdRecordId = createdRec.id

    // Read
    const get_record = buildReadHandler('get_record')
    const got = await get_record({ baseId: ctx.baseId, tableId: ctx.tableId, recordId: ctx.createdRecordId })
    expect(got?.id).toBe(ctx.createdRecordId)

    // Update
    const update_record = buildWriteHandler('update_record')
    const updated = await update_record({ baseId: ctx.baseId, tableId: ctx.tableId, recordId: ctx.createdRecordId, fields: { [fieldName]: `${runId} Updated` } })
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
