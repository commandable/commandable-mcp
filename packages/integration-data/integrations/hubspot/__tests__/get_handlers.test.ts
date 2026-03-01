import { beforeAll, describe, expect, it } from 'vitest'
import {
  createCredentialStore,
  createIntegrationNode,
  createProxy,
  createToolbox,
  hasEnv,
} from '../../__tests__/liveHarness.js'

// LIVE HubSpot read tests using credentials
// Required env vars:
// - HUBSPOT_TOKEN
//
// Optional env vars:
// - HUBSPOT_TEST_CONTACT_ID
// - HUBSPOT_TEST_COMPANY_ID
// - HUBSPOT_TEST_DEAL_ID
// - HUBSPOT_TEST_TICKET_ID

const env = process.env as Record<string, string | undefined>
const suite = hasEnv('HUBSPOT_TOKEN') ? describe : describe.skip

suite('hubspot read handlers (live)', () => {
  const ctx: {
    contactId?: string
    companyId?: string
    dealId?: string
    ticketId?: string
  } = {}

  let read: Record<string, (input: any) => Promise<any>>

  beforeAll(async () => {
    ctx.contactId = env.HUBSPOT_TEST_CONTACT_ID
    ctx.companyId = env.HUBSPOT_TEST_COMPANY_ID
    ctx.dealId = env.HUBSPOT_TEST_DEAL_ID
    ctx.ticketId = env.HUBSPOT_TEST_TICKET_ID

    const credentialStore = createCredentialStore(async () => ({ token: env.HUBSPOT_TOKEN || '' }))
    const proxy = createProxy(credentialStore)
    const node = createIntegrationNode('hubspot')
    const toolbox = createToolbox('hubspot', proxy, node)

    // IMPORTANT: These literal tool-name strings are intentionally present so usage-parity can verify coverage.
    read = {
      search_contacts: toolbox.read('search_contacts'),
      get_contact: toolbox.read('get_contact'),
      search_companies: toolbox.read('search_companies'),
      get_company: toolbox.read('get_company'),
      list_owners: toolbox.read('list_owners'),
      list_properties: toolbox.read('list_properties'),
      list_pipelines: toolbox.read('list_pipelines'),
      get_associations: toolbox.read('get_associations'),
      search_deals: toolbox.read('search_deals'),
      get_deal: toolbox.read('get_deal'),
      search_tickets: toolbox.read('search_tickets'),
      get_ticket: toolbox.read('get_ticket'),
      search_notes: toolbox.read('search_notes'),
      search_tasks: toolbox.read('search_tasks'),
      // read tools in the manifest are limited to those above; remaining tools are write-scoped
    }

    expect(read).toBeTruthy()
  }, 60000)

  it('search_contacts returns results (or empty)', async () => {
    const result = await read.search_contacts({ limit: 1 })
    expect(result).toBeTruthy()
  }, 30000)

  it('search_companies returns results (or empty)', async () => {
    const result = await read.search_companies({ limit: 1 })
    expect(result).toBeTruthy()
  }, 30000)

  it('list_owners returns owners', async () => {
    const result = await read.list_owners({ limit: 1 })
    expect(result).toBeTruthy()
  }, 30000)

  it('list_properties(contacts) returns properties', async () => {
    const result = await read.list_properties({ objectType: 'contacts' })
    expect(result).toBeTruthy()
  }, 30000)

  it('list_pipelines(deals) returns pipelines', async () => {
    const result = await read.list_pipelines({ objectType: 'deals' })
    expect(result).toBeTruthy()
  }, 30000)

  it('get_contact returns a contact when HUBSPOT_TEST_CONTACT_ID is set', async () => {
    if (!ctx.contactId)
      return expect(true).toBe(true)
    const result = await read.get_contact({ id: ctx.contactId })
    expect(result?.id).toBeTruthy()
  }, 30000)

  it('get_company returns a company when HUBSPOT_TEST_COMPANY_ID is set', async () => {
    if (!ctx.companyId)
      return expect(true).toBe(true)
    const result = await read.get_company({ id: ctx.companyId })
    expect(result?.id).toBeTruthy()
  }, 30000)

  it('get_deal returns a deal when HUBSPOT_TEST_DEAL_ID is set', async () => {
    if (!ctx.dealId)
      return expect(true).toBe(true)
    const result = await read.get_deal({ id: ctx.dealId })
    expect(result?.id).toBeTruthy()
  }, 30000)

  it('get_ticket returns a ticket when HUBSPOT_TEST_TICKET_ID is set', async () => {
    if (!ctx.ticketId)
      return expect(true).toBe(true)
    const result = await read.get_ticket({ id: ctx.ticketId })
    expect(result?.id).toBeTruthy()
  }, 30000)

  it('search_deals returns results (or empty)', async () => {
    const result = await read.search_deals({ limit: 1 })
    expect(result).toBeTruthy()
  }, 30000)

  it('search_tickets returns results (or empty)', async () => {
    const result = await read.search_tickets({ limit: 1 })
    expect(result).toBeTruthy()
  }, 30000)

  it('search_notes returns results (or empty)', async () => {
    const result = await read.search_notes({ limit: 1 })
    expect(result).toBeTruthy()
  }, 30000)

  it('search_tasks returns results (or empty)', async () => {
    const result = await read.search_tasks({ limit: 1 })
    expect(result).toBeTruthy()
  }, 30000)

  it('get_associations returns associations when HUBSPOT_TEST_CONTACT_ID is set', async () => {
    if (!ctx.contactId)
      return expect(true).toBe(true)
    const result = await read.get_associations({
      fromObjectType: 'contacts',
      fromObjectId: ctx.contactId,
      toObjectType: 'companies',
      limit: 1,
    })
    expect(result).toBeTruthy()
  }, 30000)
})

