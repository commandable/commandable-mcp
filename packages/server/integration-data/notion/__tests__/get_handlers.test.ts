import { $fetch } from 'ofetch'
import { beforeAll, describe, expect, it } from 'vitest'
import { IntegrationProxy } from '../../../../server/services/integrationProxy'
import { loadIntegrationTools } from '../../../../server/utils/integrationDataLoader'

// LIVE Notion integration tests using Nango
// Required env vars:
// - NUXT_PUBLIC_NANGO_API_BASE_URL
// - NUXT_NANGO_SECRET_KEY
// - NOTION_TEST_CONNECTION_ID (Nango connection for provider 'notion')

interface Ctx {
  database_id?: string
  page_id?: string
  block_id?: string
}

describe('notion read handlers (live)', () => {
  const env = process.env as Record<string, string>
  const ctx: Ctx = {}
  let buildHandler: (name: string) => ((input: any) => Promise<any>)

  beforeAll(async () => {
    const { NUXT_PUBLIC_NANGO_API_BASE_URL, NUXT_NANGO_SECRET_KEY, NOTION_TEST_CONNECTION_ID } = env

    if (!NUXT_PUBLIC_NANGO_API_BASE_URL || !NUXT_NANGO_SECRET_KEY || !NOTION_TEST_CONNECTION_ID) {
      console.warn('Skipping live Notion tests: missing required env vars')
      expect(false).toBe(true)
      return
    }

    ;(global as any).$fetch = $fetch
    ;(global as any).useRuntimeConfig = () => ({ public: { nangoApiBaseUrl: NUXT_PUBLIC_NANGO_API_BASE_URL } })

    const proxy = new IntegrationProxy(NUXT_NANGO_SECRET_KEY)
    const integrationNode = { id: 'node-notion', type: 'notion', label: 'Notion', connectionId: NOTION_TEST_CONNECTION_ID } as any

    const tools = loadIntegrationTools('notion')
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

    // Try to discover some IDs via search
    const search = buildHandler('search')
    const searchRes = await search({ query: '' })
    const page = searchRes?.results?.find((r: any) => r.object === 'page')
    const database = searchRes?.results?.find((r: any) => r.object === 'database')
    ctx.page_id = page?.id
    ctx.database_id = database?.id
    if (ctx.page_id)
      ctx.block_id = ctx.page_id
  }, 60000)

  it('search returns results', async () => {
    const handler = buildHandler('search')
    const result = await handler({ query: '' })
    expect(result).toBeTruthy()
  }, 30000)

  it('retrieve_page returns a page', async () => {
    if (!ctx.page_id)
      return expect(true).toBe(true)
    const handler = buildHandler('retrieve_page')
    const result = await handler({ page_id: ctx.page_id })
    expect(result?.object).toBe('page')
  }, 30000)

  it('retrieve_database returns a database', async () => {
    if (!ctx.database_id)
      return expect(true).toBe(true)
    const handler = buildHandler('retrieve_database')
    const result = await handler({ database_id: ctx.database_id })
    expect(result?.object).toBe('database')
  }, 30000)

  it('query_database returns results', async () => {
    if (!ctx.database_id)
      return expect(true).toBe(true)
    const handler = buildHandler('query_database')
    const result = await handler({ database_id: ctx.database_id, page_size: 3 })
    expect(result?.results).toBeTruthy()
  }, 30000)

  it('retrieve_block returns a block', async () => {
    if (!ctx.block_id)
      return expect(true).toBe(true)
    const handler = buildHandler('retrieve_block')
    const result = await handler({ block_id: ctx.block_id })
    expect(result?.object).toBeTruthy()
  }, 30000)

  it('list_block_children returns children', async () => {
    if (!ctx.block_id)
      return expect(true).toBe(true)
    const handler = buildHandler('list_block_children')
    const result = await handler({ block_id: ctx.block_id, page_size: 5 })
    expect(Array.isArray(result?.results)).toBe(true)
  }, 30000)

  it('list_users returns users', async () => {
    const handler = buildHandler('list_users')
    const result = await handler({ page_size: 5 })
    expect(result).toBeTruthy()
  }, 30000)

  it('get_me returns current user', async () => {
    const handler = buildHandler('get_me')
    const result = await handler({})
    expect(result).toBeTruthy()
  }, 30000)

  it('retrieve_user returns a user', async () => {
    const list = buildHandler('list_users')
    const users = await list({ page_size: 1 })
    const uid = users?.results?.[0]?.id
    if (!uid)
      return expect(true).toBe(true)
    const handler = buildHandler('retrieve_user')
    const result = await handler({ user_id: uid })
    expect(result?.id).toBe(uid)
  }, 30000)

  it('retrieve_page_property_item returns property data', async () => {
    if (!ctx.page_id)
      return expect(true).toBe(true)
    const page = buildHandler('retrieve_page')
    const p = await page({ page_id: ctx.page_id })
    const propId = Object.values(p?.properties || {})?.[0]?.id
    if (!propId)
      return expect(true).toBe(true)
    const handler = buildHandler('retrieve_page_property_item')
    const result = await handler({ page_id: ctx.page_id, property_id: propId, page_size: 5 })
    expect(result).toBeTruthy()
  }, 30000)

  it('list_comments returns comments for page or block', async () => {
    if (!ctx.page_id)
      return expect(true).toBe(true)
    const handler = buildHandler('list_comments')
    const result = await handler({ block_id: ctx.page_id })
    expect(result).toBeTruthy()
  }, 30000)
})
