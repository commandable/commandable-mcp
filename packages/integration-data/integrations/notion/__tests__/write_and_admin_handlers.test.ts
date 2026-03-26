import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createCredentialStore, createIntegrationNode, createProxy, createToolbox, hasEnv, safeCleanup } from '../../__tests__/liveHarness.js'

interface Ctx {
  createdPageId?: string
  testDatabaseId?: string
  createdDatabaseId?: string
}

const suite = hasEnv(
  'NOTION_TOKEN',
  'NOTION_TEST_PARENT_PAGE_ID',
)
  ? describe
  : describe.skip

suite('notion write handlers (live)', () => {
  const ctx: Ctx = {}
  let notion: ReturnType<typeof createToolbox>

  beforeAll(async () => {
    const env = process.env as Record<string, string | undefined>
    const credentialStore = createCredentialStore(async () => ({ token: env.NOTION_TOKEN || '' }))
    const proxy = createProxy(credentialStore)
    notion = createToolbox('notion', proxy, createIntegrationNode('notion', { label: 'Notion', credentialId: 'notion-creds' }))

    // Create a dedicated database under a known parent page for this run
    const create_database = notion.write('create_database')
    const createdDb = await create_database({
      parent: { page_id: env.NOTION_TEST_PARENT_PAGE_ID },
      title: [{ type: 'text', text: { content: `CmdTest DB ${Date.now()}` } }],
      properties: {
        Name: { title: {} },
        Status: { select: { options: [{ name: 'Open' }, { name: 'Done' }] } },
      },
    })
    ctx.testDatabaseId = createdDb?.id
    expect(ctx.testDatabaseId).toBeTruthy()
  }, 60000)

  afterAll(async () => {
    // Archive any created page + any created databases from this run
    await safeCleanup(async () => {
      if (!ctx.createdPageId)
        return
      const update_page_properties = notion.write('update_page_properties')
      await update_page_properties({ page_id: ctx.createdPageId, properties: {}, archived: true })
    })

    await safeCleanup(async () => {
      const update_database = notion.write('update_database')
      if (ctx.createdDatabaseId)
        await update_database({ database_id: ctx.createdDatabaseId, archived: true })
      if (ctx.testDatabaseId)
        await update_database({ database_id: ctx.testDatabaseId, archived: true })
    })
  }, 60_000)

  it('create_page -> retrieve_page -> update_page_properties', async () => {
    if (!ctx.testDatabaseId)
      return expect(true).toBe(true)

    const create_page = notion.write('create_page')
    const titleText = `CmdTest ${Date.now()}`
    const created = await create_page({
      parent: { database_id: ctx.testDatabaseId },
      properties: {
        Name: { title: [{ type: 'text', text: { content: titleText } }] },
      },
    })
    const pageId = created?.id
    expect(pageId).toBeTruthy()
    ctx.createdPageId = pageId

    const retrieve_page = notion.read('retrieve_page')
    const got = await retrieve_page({ page_id: pageId })
    expect(got?.id).toBe(pageId)

    const update_page_properties = notion.write('update_page_properties')
    const newTitle = `${titleText} Updated`
    const updated = await update_page_properties({ page_id: pageId, properties: { Name: { title: [{ type: 'text', text: { content: newTitle } }] } } })
    expect(updated?.id).toBe(pageId)

    // Verify via retrieve
    const gotAfter = await retrieve_page({ page_id: pageId })
    const gotTitle = gotAfter?.properties?.Name?.title?.[0]?.plain_text || gotAfter?.properties?.Name?.title?.[0]?.text?.content
    expect(gotTitle?.includes('Updated')).toBe(true)
  }, 90000)

  it('append_block_children on created page', async () => {
    if (!ctx.createdPageId)
      return expect(true).toBe(true)
    const append_block_children = notion.write('append_block_children')
    const contentText = 'Hello from test'
    const res = await append_block_children({
      block_id: ctx.createdPageId,
      children: [
        { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: contentText } }] } },
      ],
    })
    expect(res).toBeTruthy()

    const retrieve_block = notion.read('retrieve_block')
    const textMatches = (block: any) =>
      block?.paragraph?.rich_text?.some((t: any) => (t?.plain_text || t?.text?.content) === contentText)

    const appendedId = res?.results?.[0]?.id
    if (appendedId) {
      const full = await retrieve_block({ block_id: appendedId })
      expect(textMatches(full)).toBe(true)
      return
    }

    // Compact list_block_children returns summaries only; load full blocks by id.
    const list_block_children = notion.read('list_block_children')
    const listed = await list_block_children({ block_id: ctx.createdPageId })
    const summaries = listed?.blocks ?? listed?.results ?? []
    expect(Array.isArray(summaries)).toBe(true)
    let found = false
    for (const s of summaries) {
      if (s?.type !== 'paragraph' || !s?.id)
        continue
      const full = await retrieve_block({ block_id: s.id })
      if (textMatches(full)) {
        found = true
        break
      }
    }
    expect(found).toBe(true)
  }, 60000)

  it('create_comment on created page', async () => {
    if (!ctx.createdPageId)
      return expect(true).toBe(true)
    const create_comment = notion.write('create_comment')
    const commentText = 'Test comment'
    const res = await create_comment({ parent: { block_id: ctx.createdPageId }, rich_text: [{ type: 'text', text: { content: commentText } }] })
    expect(res?.object === 'comment' || res?.results).toBeTruthy()

    // Verify via list_comments
    const list_comments = notion.read('list_comments')
    const comments = await list_comments({ block_id: ctx.createdPageId })
    const hasComment = (comments?.results || comments || []).some((c: any) => c?.rich_text?.some((t: any) => (t?.plain_text || t?.text?.content)?.includes(commentText)))
    expect(hasComment).toBe(true)
  }, 60000)

  it('update_block and delete_block on appended paragraph', async () => {
    if (!ctx.createdPageId)
      return expect(true).toBe(true)
    // Create a specific block to edit
    const append_block_children = notion.write('append_block_children')
    const appended = await append_block_children({
      block_id: ctx.createdPageId,
      children: [
        { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: 'Edit me' } }] } },
      ],
    })
    const blockId = appended?.results?.[0]?.id || appended?.id
    if (!blockId)
      return expect(true).toBe(true)

    const update_block = notion.write('update_block')
    const editedText = 'Edited'
    const updated = await update_block({ block_id: blockId, body: { paragraph: { rich_text: [{ type: 'text', text: { content: editedText } }] } } })
    expect(updated?.id).toBe(blockId)

    // Verify via retrieve_block
    const retrieve_block = notion.read('retrieve_block')
    const gotBlock = await retrieve_block({ block_id: blockId })
    const gotEdited = gotBlock?.paragraph?.rich_text?.some((t: any) => (t?.plain_text || t?.text?.content) === editedText)
    expect(gotEdited).toBe(true)

    const delete_block = notion.write('delete_block')
    const del = await delete_block({ block_id: blockId })
    expect(del?.archived === true || del?.id === blockId).toBe(true)

    // Verify archived via retrieve_block
    const gotAfterDelete = await retrieve_block({ block_id: blockId })
    expect(gotAfterDelete?.archived === true).toBe(true)
  }, 90000)

  it('create_database then update_database under created page (optional)', async () => {
    if (!ctx.createdPageId)
      return expect(true).toBe(true)
    const create_database = notion.write('create_database')
    const created = await create_database({
      parent: { page_id: ctx.createdPageId },
      title: [{ type: 'text', text: { content: `CmdDB ${Date.now()}` } }],
      properties: {
        Name: { title: {} },
        Status: { select: { options: [{ name: 'Open' }, { name: 'Done' }] } },
      },
    })
    const dbId = created?.id
    ctx.createdDatabaseId = dbId
    expect(dbId).toBeTruthy()

    const update_database = notion.write('update_database')
    const updated = await update_database({ database_id: dbId, title: [{ type: 'text', text: { content: 'CmdDB Updated' } }] })
    expect(updated?.id).toBe(dbId)

    // Verify via retrieve_database
    const retrieve_database = notion.read('retrieve_database')
    const gotDb = await retrieve_database({ database_id: dbId })
    const titleText = gotDb?.title?.[0]?.plain_text || gotDb?.title?.[0]?.text?.content
    expect(titleText?.includes('Updated')).toBe(true)
  }, 120000)
})
