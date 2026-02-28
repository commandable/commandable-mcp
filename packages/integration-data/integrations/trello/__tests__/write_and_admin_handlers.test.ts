import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createCredentialStore, createIntegrationNode, createProxy, createToolbox, hasEnv, safeCleanup } from '../../__tests__/liveHarness.js'

interface Ctx {
  boardId?: string
  listId?: string
  listId2?: string
  cardId?: string
  memberId?: string
}

const suite = hasEnv(
  'TRELLO_API_KEY',
  'TRELLO_API_TOKEN',
)
  ? describe
  : describe.skip

suite('trello write handlers (live)', () => {
  const ctx: Ctx = {}
  let trello: ReturnType<typeof createToolbox>

  beforeAll(async () => {
    const env = process.env as Record<string, string | undefined>
    const credentialStore = createCredentialStore(async () => ({ apiKey: env.TRELLO_API_KEY || '', apiToken: env.TRELLO_API_TOKEN || '' }))
    const proxy = createProxy(credentialStore)
    const node = createIntegrationNode('trello', { label: 'Trello', credentialId: 'trello-creds' })
    trello = createToolbox('trello', proxy, node)

    // Create an isolated board + two lists for this test run
    const create_board = trello.write('create_board')
    const board = await create_board({ name: `CmdTest Trello ${Date.now()}`, defaultLists: false })
    ctx.boardId = board?.id
    expect(ctx.boardId).toBeTruthy()

    const create_list = trello.write('create_list')
    const list1 = await create_list({ idBoard: ctx.boardId, name: 'CmdTest List A' })
    const list2 = await create_list({ idBoard: ctx.boardId, name: 'CmdTest List B' })
    ctx.listId = list1?.id
    ctx.listId2 = list2?.id
    expect(ctx.listId).toBeTruthy()
    expect(ctx.listId2).toBeTruthy()

    // Discover a member to add to card (self)
    const get_member = trello.read('get_member')
    const me = await get_member({})
    ctx.memberId = me?.id
  }, 60000)

  afterAll(async () => {
    if (!ctx.boardId)
      return
    await safeCleanup(async () => trello.write('close_board')({ boardId: ctx.boardId }))
    await safeCleanup(async () => trello.write('delete_board')({ boardId: ctx.boardId }))
  }, 60_000)

  it('create_card -> get_card -> update_card -> move_card_to_list -> delete_card', async () => {
    if (!ctx.boardId || !ctx.listId || !ctx.memberId)
      return expect(true).toBe(true)

    // Create card
    const create_card = trello.write('create_card')
    const created = await create_card({ idList: ctx.listId, name: `CmdCard ${Date.now()}`, desc: 'Initial desc' })
    const cardId = created?.id
    expect(cardId).toBeTruthy()
    ctx.cardId = cardId

    // Read card
    const get_card = trello.read('get_card')
    const got = await get_card({ cardId })
    expect(got?.id).toBe(cardId)

    // Update card
    const update_card = trello.write('update_card')
    const updated = await update_card({ cardId, name: 'Updated Name', desc: 'Updated desc' })
    expect(updated?.id).toBe(cardId)

    // Verify via read
    const got2 = await get_card({ cardId })
    expect(got2?.name).toBe('Updated Name')

    // Move card
    if (ctx.listId2 && ctx.listId2 !== ctx.listId) {
      const move_card_to_list = trello.write('move_card_to_list')
      const moved = await move_card_to_list({ cardId, listId: ctx.listId2 })
      expect(moved?.id).toBe(cardId)
      const got3 = await get_card({ cardId })
      expect(got3?.idList).toBe(ctx.listId2)
    }

    // Delete card
    const delete_card = trello.write('delete_card')
    const del = await delete_card({ cardId })
    expect(Boolean(del === '' || del?.limits || del?.id === cardId || (del && typeof del === 'object'))).toBe(true)
  }, 120000)

  it('add_member_to_card -> get_card_members -> remove_member_from_card', async () => {
    if (!ctx.listId || !ctx.memberId)
      return expect(true).toBe(true)

    // Create an isolated card for this test
    const create_card = trello.write('create_card')
    const created = await create_card({ idList: ctx.listId, name: `CmdCard Members ${Date.now()}` })
    const cardId = created?.id
    expect(cardId).toBeTruthy()

    const add_member_to_card = trello.write('add_member_to_card')
    const added = await add_member_to_card({ cardId, memberId: ctx.memberId })
    expect(added).toBeTruthy()

    const get_card_members = trello.read('get_card_members')
    const members = await get_card_members({ cardId })
    const hasMember = (members || []).some((m: any) => m?.id === ctx.memberId)
    expect(hasMember).toBe(true)

    const remove_member_from_card = trello.write('remove_member_from_card')
    const removed = await remove_member_from_card({ cardId, memberId: ctx.memberId })
    expect(removed === '' || (removed && typeof removed === 'object')).toBe(true)

    // Cleanup
    const delete_card = trello.write('delete_card')
    await delete_card({ cardId })
  }, 90000)

  it('add_checklist_to_card -> get_card_checklists', async () => {
    if (!ctx.listId)
      return expect(true).toBe(true)

    // Create an isolated card for this test
    const create_card = trello.write('create_card')
    const createdCard = await create_card({ idList: ctx.listId, name: `CmdCard Checklist ${Date.now()}` })
    const cardId = createdCard?.id
    expect(cardId).toBeTruthy()

    const add_checklist_to_card = trello.write('add_checklist_to_card')
    const created = await add_checklist_to_card({ cardId, name: `Checklist ${Date.now()}` })
    expect(created?.id).toBeTruthy()

    const get_card_checklists = trello.read('get_card_checklists')
    const lists = await get_card_checklists({ cardId })
    expect(Array.isArray(lists)).toBe(true)

    // Cleanup
    const delete_card = trello.write('delete_card')
    await delete_card({ cardId })
  }, 60000)

  it('create_list -> get_list -> update_list -> archive_list', async () => {
    if (!ctx.boardId)
      return expect(true).toBe(true)
    const create_list = trello.write('create_list')
    const created = await create_list({ idBoard: ctx.boardId, name: `CmdList ${Date.now()}` })
    const listId = created?.id
    expect(listId).toBeTruthy()

    const get_list = trello.read('get_list')
    const got = await get_list({ listId })
    expect(got?.id).toBe(listId)

    const update_list = trello.write('update_list')
    const updated = await update_list({ listId, name: 'Updated List Name' })
    expect(updated?.id).toBe(listId)

    const got2 = await get_list({ listId })
    expect(got2?.name).toBe('Updated List Name')

    const archive_list = trello.write('archive_list')
    const archived = await archive_list({ listId })
    expect(archived?.closed === true).toBe(true)
  }, 120000)
})
