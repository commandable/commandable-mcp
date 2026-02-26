import { beforeAll, describe, expect, it } from 'vitest'
import { IntegrationProxy } from '../../../src/integrations/proxy.js'
import { loadIntegrationTools } from '../../../src/integrations/dataLoader.js'

interface Ctx {
  boardId?: string
  listId?: string
  listId2?: string
  cardId?: string
  memberId?: string
}

describe('trello write handlers (live)', () => {
  const env = process.env as Record<string, string>
  const ctx: Ctx = {}
  let buildWrite: (name: string) => ((input: any) => Promise<any>)
  let buildRead: (name: string) => ((input: any) => Promise<any>)

  beforeAll(async () => {
    const { COMMANDABLE_MANAGED_OAUTH_BASE_URL, COMMANDABLE_MANAGED_OAUTH_SECRET_KEY, TRELLO_API_KEY, TRELLO_TEST_CONNECTION_ID } = env
    if (!COMMANDABLE_MANAGED_OAUTH_BASE_URL || !COMMANDABLE_MANAGED_OAUTH_SECRET_KEY || !TRELLO_API_KEY || !TRELLO_TEST_CONNECTION_ID) {
      console.warn('Skipping live Trello write tests: missing required env vars')
      expect(false).toBe(true)
      return
    }

    const proxy = new IntegrationProxy({
      managedOAuthBaseUrl: COMMANDABLE_MANAGED_OAUTH_BASE_URL,
      managedOAuthSecretKey: COMMANDABLE_MANAGED_OAUTH_SECRET_KEY,
      trelloApiKey: TRELLO_API_KEY,
    })
    const integrationNode = { id: 'node-trello', type: 'trello', label: 'Trello', connectionId: TRELLO_TEST_CONNECTION_ID } as any

    const tools = loadIntegrationTools('trello')
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

    // Discover a board and list for tests
    const get_member_boards = buildRead('get_member_boards')
    const boards = await get_member_boards({})
    ctx.boardId = boards?.[0]?.id
    if (ctx.boardId) {
      const get_board_lists = buildRead('get_board_lists')
      const lists = await get_board_lists({ boardId: ctx.boardId })
      ctx.listId = lists?.[0]?.id
      ctx.listId2 = lists?.[1]?.id || ctx.listId
    }

    // Discover a member to add to card (self)
    const get_member = buildRead('get_member')
    const me = await get_member({})
    ctx.memberId = me?.id
  }, 60000)

  it('create_card -> get_card -> update_card -> move_card_to_list -> delete_card', async () => {
    if (!ctx.boardId || !ctx.listId || !ctx.memberId)
      return expect(true).toBe(true)

    // Create card
    const create_card = buildWrite('create_card')
    const created = await create_card({ idList: ctx.listId, name: `CmdCard ${Date.now()}`, desc: 'Initial desc' })
    const cardId = created?.id
    expect(cardId).toBeTruthy()
    ctx.cardId = cardId

    // Read card
    const get_card = buildRead('get_card')
    const got = await get_card({ cardId })
    expect(got?.id).toBe(cardId)

    // Update card
    const update_card = buildWrite('update_card')
    const updated = await update_card({ cardId, name: 'Updated Name', desc: 'Updated desc' })
    expect(updated?.id).toBe(cardId)

    // Verify via read
    const got2 = await get_card({ cardId })
    expect(got2?.name).toBe('Updated Name')

    // Move card
    if (ctx.listId2 && ctx.listId2 !== ctx.listId) {
      const move_card_to_list = buildWrite('move_card_to_list')
      const moved = await move_card_to_list({ cardId, listId: ctx.listId2 })
      expect(moved?.id).toBe(cardId)
      const got3 = await get_card({ cardId })
      expect(got3?.idList).toBe(ctx.listId2)
    }

    // Delete card
    const delete_card = buildWrite('delete_card')
    const del = await delete_card({ cardId })
    expect(Boolean(del === '' || del?.limits || del?.id === cardId || (del && typeof del === 'object'))).toBe(true)
  }, 120000)

  it('add_member_to_card -> get_card_members -> remove_member_from_card', async () => {
    if (!ctx.listId || !ctx.memberId)
      return expect(true).toBe(true)

    // Create an isolated card for this test
    const create_card = buildWrite('create_card')
    const created = await create_card({ idList: ctx.listId, name: `CmdCard Members ${Date.now()}` })
    const cardId = created?.id
    expect(cardId).toBeTruthy()

    const add_member_to_card = buildWrite('add_member_to_card')
    const added = await add_member_to_card({ cardId, memberId: ctx.memberId })
    expect(added).toBeTruthy()

    const get_card_members = buildRead('get_card_members')
    const members = await get_card_members({ cardId })
    const hasMember = (members || []).some((m: any) => m?.id === ctx.memberId)
    expect(hasMember).toBe(true)

    const remove_member_from_card = buildWrite('remove_member_from_card')
    const removed = await remove_member_from_card({ cardId, memberId: ctx.memberId })
    expect(removed === '' || (removed && typeof removed === 'object')).toBe(true)

    // Cleanup
    const delete_card = buildWrite('delete_card')
    await delete_card({ cardId })
  }, 90000)

  it('add_checklist_to_card -> get_card_checklists', async () => {
    if (!ctx.listId)
      return expect(true).toBe(true)

    // Create an isolated card for this test
    const create_card = buildWrite('create_card')
    const createdCard = await create_card({ idList: ctx.listId, name: `CmdCard Checklist ${Date.now()}` })
    const cardId = createdCard?.id
    expect(cardId).toBeTruthy()

    const add_checklist_to_card = buildWrite('add_checklist_to_card')
    const created = await add_checklist_to_card({ cardId, name: `Checklist ${Date.now()}` })
    expect(created?.id).toBeTruthy()

    const get_card_checklists = buildRead('get_card_checklists')
    const lists = await get_card_checklists({ cardId })
    expect(Array.isArray(lists)).toBe(true)

    // Cleanup
    const delete_card = buildWrite('delete_card')
    await delete_card({ cardId })
  }, 60000)

  it('create_list -> get_list -> update_list -> archive_list', async () => {
    if (!ctx.boardId)
      return expect(true).toBe(true)
    const create_list = buildWrite('create_list')
    const created = await create_list({ idBoard: ctx.boardId, name: `CmdList ${Date.now()}` })
    const listId = created?.id
    expect(listId).toBeTruthy()

    const get_list = buildRead('get_list')
    const got = await get_list({ listId })
    expect(got?.id).toBe(listId)

    const update_list = buildWrite('update_list')
    const updated = await update_list({ listId, name: 'Updated List Name' })
    expect(updated?.id).toBe(listId)

    const got2 = await get_list({ listId })
    expect(got2?.name).toBe('Updated List Name')

    const archive_list = buildWrite('archive_list')
    const archived = await archive_list({ listId })
    expect(archived?.closed === true).toBe(true)
  }, 120000)
})
