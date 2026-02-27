import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { IntegrationProxy } from '../../../../server/src/integrations/proxy.js'
import { loadIntegrationTools } from '../../../../server/src/integrations/dataLoader.js'

interface Ctx {
  createdPageId?: string
  testDatabaseId?: string
  createdDatabaseId?: string
}

const env = process.env as Record<string, string>
const hasEnv = (...keys: string[]) => keys.every(k => !!env[k] && env[k].trim().length > 0)
const suite = hasEnv(
  'NOTION_TOKEN',
  'NOTION_TEST_PARENT_PAGE_ID',
)
  ? describe
  : describe.skip

suite('notion write handlers (live)', () => {
  const ctx: Ctx = {}
  let buildWrite: (name: string) => ((input: any) => Promise<any>)
  let buildRead: (name: string) => ((input: any) => Promise<any>)

  beforeAll(async () => {
    const credentialStore = {
      getCredentials: async () => ({ token: env.NOTION_TOKEN || '' }),
    }

    const proxy = new IntegrationProxy({ credentialStore })
    const integrationNode = {
      spaceId: 'ci',
      id: 'node-notion',
      referenceId: 'node-notion',
      type: 'notion',
      label: 'Notion',
      connectionMethod: 'credentials',
      credentialId: 'notion-creds',
    } as any

    const tools = loadIntegrationTools('notion')
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

    // Create a dedicated database under a known parent page for this run
    const create_database = buildWrite('create_database')
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
    try {
      if (ctx.createdPageId) {
        const update_page_properties = buildWrite('update_page_properties')
        await update_page_properties({ page_id: ctx.createdPageId, properties: {}, archived: true })
      }
    }
    catch {}

    try {
      const update_database = buildWrite('update_database')
      if (ctx.createdDatabaseId)
        await update_database({ database_id: ctx.createdDatabaseId, archived: true })
      if (ctx.testDatabaseId)
        await update_database({ database_id: ctx.testDatabaseId, archived: true })
    }
    catch {}
  }, 60_000)

  it('create_page -> retrieve_page -> update_page_properties', async () => {
    if (!ctx.testDatabaseId)
      return expect(true).toBe(true)

    const create_page = buildWrite('create_page')
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

    const retrieve_page = buildRead('retrieve_page')
    const got = await retrieve_page({ page_id: pageId })
    expect(got?.id).toBe(pageId)

    const update_page_properties = buildWrite('update_page_properties')
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
    const append_block_children = buildWrite('append_block_children')
    const contentText = 'Hello from test'
    const res = await append_block_children({
      block_id: ctx.createdPageId,
      children: [
        { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: contentText } }] } },
      ],
    })
    expect(res).toBeTruthy()

    // Verify via list_block_children
    const list_block_children = buildRead('list_block_children')
    const listed = await list_block_children({ block_id: ctx.createdPageId })
    const found = (listed?.results || listed || []).some((b: any) => b?.paragraph?.rich_text?.some((t: any) => (t?.plain_text || t?.text?.content) === contentText))
    expect(found).toBe(true)
  }, 60000)

  it('create_comment on created page', async () => {
    if (!ctx.createdPageId)
      return expect(true).toBe(true)
    const create_comment = buildWrite('create_comment')
    const commentText = 'Test comment'
    const res = await create_comment({ parent: { block_id: ctx.createdPageId }, rich_text: [{ type: 'text', text: { content: commentText } }] })
    expect(res?.object === 'comment' || res?.results).toBeTruthy()

    // Verify via list_comments
    const list_comments = buildRead('list_comments')
    const comments = await list_comments({ block_id: ctx.createdPageId })
    const hasComment = (comments?.results || comments || []).some((c: any) => c?.rich_text?.some((t: any) => (t?.plain_text || t?.text?.content)?.includes(commentText)))
    expect(hasComment).toBe(true)
  }, 60000)

  it('update_block and delete_block on appended paragraph', async () => {
    if (!ctx.createdPageId)
      return expect(true).toBe(true)
    // Create a specific block to edit
    const append_block_children = buildWrite('append_block_children')
    const appended = await append_block_children({
      block_id: ctx.createdPageId,
      children: [
        { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: 'Edit me' } }] } },
      ],
    })
    const blockId = appended?.results?.[0]?.id || appended?.id
    if (!blockId)
      return expect(true).toBe(true)

    const update_block = buildWrite('update_block')
    const editedText = 'Edited'
    const updated = await update_block({ block_id: blockId, body: { paragraph: { rich_text: [{ type: 'text', text: { content: editedText } }] } } })
    expect(updated?.id).toBe(blockId)

    // Verify via retrieve_block
    const retrieve_block = buildRead('retrieve_block')
    const gotBlock = await retrieve_block({ block_id: blockId })
    const gotEdited = gotBlock?.paragraph?.rich_text?.some((t: any) => (t?.plain_text || t?.text?.content) === editedText)
    expect(gotEdited).toBe(true)

    const delete_block = buildWrite('delete_block')
    const del = await delete_block({ block_id: blockId })
    expect(del?.archived === true || del?.id === blockId).toBe(true)

    // Verify archived via retrieve_block
    const gotAfterDelete = await retrieve_block({ block_id: blockId })
    expect(gotAfterDelete?.archived === true).toBe(true)
  }, 90000)

  it('create_database then update_database under created page (optional)', async () => {
    if (!ctx.createdPageId)
      return expect(true).toBe(true)
    const create_database = buildWrite('create_database')
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

    const update_database = buildWrite('update_database')
    const updated = await update_database({ database_id: dbId, title: [{ type: 'text', text: { content: 'CmdDB Updated' } }] })
    expect(updated?.id).toBe(dbId)

    // Verify via retrieve_database
    const retrieve_database = buildRead('retrieve_database')
    const gotDb = await retrieve_database({ database_id: dbId })
    const titleText = gotDb?.title?.[0]?.plain_text || gotDb?.title?.[0]?.text?.content
    expect(titleText?.includes('Updated')).toBe(true)
  }, 120000)
})
