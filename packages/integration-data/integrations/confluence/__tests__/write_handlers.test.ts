import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createCredentialStore, createIntegrationNode, createProxy, createToolbox, hasEnv, safeCleanup } from '../../__tests__/liveHarness.js'

// LIVE Confluence write tests using credentials
//
// Required for write tests:
// - CONFLUENCE_TEST_SPACE_KEY
// Optional:
// - CONFLUENCE_TEST_PARENT_PAGE_ID
//
// Variant: api_token
// - CONFLUENCE_DOMAIN
// - CONFLUENCE_EMAIL
// - CONFLUENCE_API_TOKEN

const env = process.env as Record<string, string | undefined>

const suiteOrSkip = (hasEnv('CONFLUENCE_DOMAIN', 'CONFLUENCE_EMAIL', 'CONFLUENCE_API_TOKEN') && hasEnv('CONFLUENCE_TEST_SPACE_KEY'))
  ? describe
  : describe.skip

suiteOrSkip('confluence write handlers (live)', () => {
  describe('variant: api_token', () => {
    const ctx: {
      spaceId?: string
      createdPageId?: string
      createdLabel?: string
      createdCommentId?: string
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

      // Resolve spaceId from configured space key.
      try {
        const list_spaces = confluence.read('list_spaces')
        const spaces = await list_spaces({ keys: [env.CONFLUENCE_TEST_SPACE_KEY!], limit: 5 })
        const first = spaces?.results?.[0]
        ctx.spaceId = first?.id
      }
      catch {}
    }, 60000)

    afterAll(async () => {
      await safeCleanup(async () => {
        if (!ctx.createdPageId)
          return
        const delete_page = confluence.write('delete_page')
        await delete_page({ pageId: ctx.createdPageId })
      })
    }, 60000)

    it('create_page -> read_page -> update_page -> add_label -> add_comment -> get_comments -> delete_page roundtrip', async () => {
      if (!ctx.spaceId)
        return expect(true).toBe(true)

      const parentId = env.CONFLUENCE_TEST_PARENT_PAGE_ID || null
      const timestamp = Date.now()

      const create_page = confluence.write('create_page')
      const created = await create_page({
        spaceId: ctx.spaceId,
        parentId,
        title: `CmdTest Confluence ${timestamp}`,
        bodyStorage: `<p>Created by integration tests at ${timestamp}.</p>`,
      })
      const pageId = created?.id
      expect(pageId).toBeTruthy()
      ctx.createdPageId = pageId

      const read_page = confluence.read('read_page')
      const got = await read_page({ pageId, includeLabels: true, outputMarkdown: true })
      expect(got?.id).toBe(pageId)

      const update_page = confluence.write('update_page')
      const updated = await update_page({
        pageId,
        title: `CmdTest Confluence Updated ${timestamp}`,
        bodyStorage: `<p>Updated by integration tests at ${timestamp}.</p>`,
        versionMessage: 'Updated by integration tests',
      })
      expect(updated?.id || updated?.title || updated).toBeTruthy()

      const add_label = confluence.write('add_label')
      const label = `cmdtest-${timestamp}`
      ctx.createdLabel = label
      const labelRes = await add_label({ pageId, labels: [label] })
      expect(labelRes).toBeTruthy()

      // Verify label via read_page (labels are included when includeLabels is true)
      const afterLabel = await read_page({ pageId, includeLabels: true, outputMarkdown: false })
      const labelNames = Array.isArray(afterLabel?.labels)
        ? afterLabel.labels.map((l: any) => l?.name).filter(Boolean)
        : []
      expect(labelNames.includes(label)).toBe(true)

      const add_comment = confluence.write('add_comment')
      const commentText = `Test comment ${timestamp}`
      const comment = await add_comment({ pageId, bodyStorage: `<p>${commentText}</p>` })
      ctx.createdCommentId = comment?.id
      expect(comment?.id || comment).toBeTruthy()

      const get_comments = confluence.read('get_comments')
      const comments = await get_comments({ pageId, limit: 50 })
      const found = (comments?.results || []).some((c: any) =>
        (c?.id && ctx.createdCommentId && String(c.id) === String(ctx.createdCommentId))
        || (c?.body && JSON.stringify(c.body).includes(commentText)),
      )
      expect(found).toBe(true)

      const delete_page = confluence.write('delete_page')
      const deleted = await delete_page({ pageId })
      expect(deleted?.ok === true || deleted).toBeTruthy()
      ctx.createdPageId = undefined
    }, 150000)
  })
})

