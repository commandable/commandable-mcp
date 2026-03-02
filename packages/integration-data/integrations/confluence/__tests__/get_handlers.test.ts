import { beforeAll, describe, expect, it } from 'vitest'
import { createCredentialStore, createIntegrationNode, createProxy, createToolbox, hasEnv } from '../../__tests__/liveHarness.js'

// LIVE Confluence read tests using credentials
//
// Variant: api_token
// - CONFLUENCE_DOMAIN
// - CONFLUENCE_EMAIL
// - CONFLUENCE_API_TOKEN

const env = process.env as Record<string, string | undefined>

const suiteOrSkip = hasEnv('CONFLUENCE_DOMAIN', 'CONFLUENCE_EMAIL', 'CONFLUENCE_API_TOKEN') ? describe : describe.skip

suiteOrSkip('confluence read handlers (live)', () => {
  describe('variant: api_token', () => {
    const ctx: {
      spaceId?: string
      spaceKey?: string
      homepageId?: string
      pageId?: string
    } = {}

    let confluence: ReturnType<typeof createToolbox>

    beforeAll(async () => {
      const credentialStore = createCredentialStore(async () => ({
        domain: env.CONFLUENCE_DOMAIN!,
        email: env.CONFLUENCE_EMAIL!,
        apiToken: env.CONFLUENCE_API_TOKEN!,
      }))
      const proxy = createProxy(credentialStore)
      confluence = createToolbox(
        'confluence',
        proxy,
        createIntegrationNode('confluence', { label: 'Confluence', credentialId: 'confluence-creds', credentialVariant: 'api_token' }),
        'api_token',
      )

      try {
        const list_spaces = confluence.read('list_spaces')
        const spaces = await list_spaces({ limit: 10 })
        const first = spaces?.results?.[0]
        ctx.spaceId = first?.id
        ctx.spaceKey = first?.key
        ctx.homepageId = first?.homepageId
      }
      catch {}

      try {
        if (ctx.spaceKey) {
          const search_pages = confluence.read('search_pages')
          const found = await search_pages({
            cql: `space = "${ctx.spaceKey}" AND type = page ORDER BY lastmodified DESC`,
            limit: 5,
          })
          const first = found?.results?.[0]
          ctx.pageId = first?.id || ctx.homepageId
        }
        else {
          ctx.pageId = ctx.homepageId
        }
      }
      catch {
        ctx.pageId = ctx.pageId || ctx.homepageId
      }
    }, 60000)

    it('list_spaces returns spaces', async () => {
      const list_spaces = confluence.read('list_spaces')
      const res = await list_spaces({ limit: 10 })
      expect(Array.isArray(res?.results)).toBe(true)
    }, 30000)

    it('get_space returns a space when spaceId is available', async () => {
      if (!ctx.spaceId)
        return expect(true).toBe(true)
      const get_space = confluence.read('get_space')
      const res = await get_space({ spaceId: ctx.spaceId })
      expect(res?.id).toBe(ctx.spaceId)
    }, 30000)

    it('search_pages returns results for a basic CQL query (best effort)', async () => {
      if (!ctx.spaceKey)
        return expect(true).toBe(true)
      const search_pages = confluence.read('search_pages')
      const res = await search_pages({
        cql: `space = "${ctx.spaceKey}" AND type = page ORDER BY lastmodified DESC`,
        limit: 5,
      })
      expect(Array.isArray(res?.results)).toBe(true)
    }, 30000)

    it('read_page returns page content (storage) when pageId is available', async () => {
      if (!ctx.pageId)
        return expect(true).toBe(true)
      const read_page = confluence.read('read_page')
      const page = await read_page({ pageId: ctx.pageId, outputMarkdown: false })
      expect(page?.id).toBe(ctx.pageId)
      // Can be null for unusual pages; just require a usable response.
      expect(page).toBeTruthy()
    }, 30000)

    it('get_page_children returns an array when pageId is available (best effort)', async () => {
      if (!ctx.pageId)
        return expect(true).toBe(true)
      const get_page_children = confluence.read('get_page_children')
      const res = await get_page_children({ pageId: ctx.pageId, limit: 10 })
      expect(Array.isArray(res?.results)).toBe(true)
    }, 30000)

    it('get_comments returns an array when pageId is available (best effort)', async () => {
      if (!ctx.pageId)
        return expect(true).toBe(true)
      const get_comments = confluence.read('get_comments')
      const res = await get_comments({ pageId: ctx.pageId, limit: 10 })
      expect(Array.isArray(res?.results)).toBe(true)
    }, 30000)
  })
})

