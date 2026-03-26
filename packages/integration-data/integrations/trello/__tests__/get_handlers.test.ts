import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createCredentialStore, createIntegrationNode, createProxy, createToolbox, hasEnv, safeCleanup } from '../../__tests__/liveHarness.js'

// This is a LIVE integration test suite that hits Trello using credentials.
// Required env vars:
// - TRELLO_API_KEY
// - TRELLO_API_TOKEN

interface Ids {
  boardId?: string
  listId?: string
  cardId?: string
  orgId?: string
}

const suite = hasEnv(
  'TRELLO_API_KEY',
  'TRELLO_API_TOKEN',
)
  ? describe
  : describe.skip

suite('trello read handlers (live)', () => {
  const ids: Ids = {}
  let boardId: string | undefined
  let listId: string | undefined

  let trello: ReturnType<typeof createToolbox>

  beforeAll(async () => {
    const env = process.env as Record<string, string | undefined>
    const credentialStore = createCredentialStore(async () => ({ apiKey: env.TRELLO_API_KEY || '', apiToken: env.TRELLO_API_TOKEN || '' }))
    const proxy = createProxy(credentialStore)
    const node = createIntegrationNode('trello', { label: 'Trello', credentialId: 'trello-creds' })
    trello = createToolbox('trello', proxy, node)

    // Create an isolated board/list/card for this run so tests don’t touch random user boards.
    const board = await trello.write('create_board')({ name: `CmdTest Trello Read ${Date.now()}`, defaultLists: false })
    boardId = board?.id
    ids.boardId = boardId
    expect(ids.boardId).toBeTruthy()

    const list = await trello.write('create_list')({ idBoard: boardId, name: 'CmdTest List' })
    listId = list?.id
    ids.listId = listId
    expect(ids.listId).toBeTruthy()

    const card = await trello.write('create_card')({ idList: listId, name: `CmdTest Card ${Date.now()}` })
    ids.cardId = card?.id
    expect(ids.cardId).toBeTruthy()

    const get_member_organizations = trello.read('get_member_organizations')
    const orgs = await get_member_organizations({})
    ids.orgId = orgs?.organizations?.[0]?.id
  }, 60000)

  afterAll(async () => {
    if (!boardId)
      return
    await safeCleanup(async () => trello.write('close_board')({ boardId }))
    await safeCleanup(async () => trello.write('delete_board')({ boardId }))
  }, 60_000)

  it('get_member returns current member', async () => {
    const handler = trello.read('get_member')
    const result = await handler({})
    expect(result).toBeTruthy()
    expect(typeof result.id).toBe('string')
    expect(typeof result.username).toBe('string')
  }, 30000)

  it('get_member_boards returns a compact board summary object', async () => {
    const handler = trello.read('get_member_boards')
    const result = await handler({})
    expect(result && typeof result === 'object').toBe(true)
    expect(typeof (result as any).count).toBe('number')
    expect(Array.isArray((result as any).boards)).toBe(true)
    if ((result as any).boards.length > 0) {
      const b = (result as any).boards[0]
      expect(typeof b.id).toBe('string')
      expect(typeof b.name).toBe('string')
      expect('closed' in b).toBe(true)
    }
  }, 30000)

  it('get_member_organizations returns a compact object', async () => {
    const handler = trello.read('get_member_organizations')
    const result = await handler({})
    expect(Array.isArray(result?.organizations)).toBe(true)
  }, 30000)

  it('get_board works with boardId', async () => {
    if (!ids.boardId)
      return expect(true).toBe(true)
    const handler = trello.read('get_board')
    const result = await handler({ boardId: ids.boardId })
    expect(result?.id).toBe(ids.boardId)
  }, 30000)

  it('get_board_lists returns lists', async () => {
    if (!ids.boardId)
      return expect(true).toBe(true)
    const handler = trello.read('get_board_lists')
    const result = await handler({ boardId: ids.boardId })
    expect(Array.isArray(result?.lists)).toBe(true)
  }, 30000)

  it('get_board_cards returns cards', async () => {
    if (!ids.boardId)
      return expect(true).toBe(true)
    const handler = trello.read('get_board_cards')
    const result = await handler({ boardId: ids.boardId })
    expect(Array.isArray(result?.cards)).toBe(true)
  }, 30000)

  it('get_board_members returns members', async () => {
    if (!ids.boardId)
      return expect(true).toBe(true)
    const handler = trello.read('get_board_members')
    const result = await handler({ boardId: ids.boardId })
    expect(Array.isArray(result)).toBe(true)
  }, 30000)

  it('get_board_labels returns labels', async () => {
    if (!ids.boardId)
      return expect(true).toBe(true)
    const handler = trello.read('get_board_labels')
    const result = await handler({ boardId: ids.boardId })
    expect(Array.isArray(result)).toBe(true)
  }, 30000)

  it('get_board_custom_fields returns custom fields', async () => {
    if (!ids.boardId)
      return expect(true).toBe(true)
    const handler = trello.read('get_board_custom_fields')
    const result = await handler({ boardId: ids.boardId })
    expect(Array.isArray(result)).toBe(true)
  }, 30000)

  it('get_board_memberships returns memberships', async () => {
    if (!ids.boardId)
      return expect(true).toBe(true)
    const handler = trello.read('get_board_memberships')
    const result = await handler({ boardId: ids.boardId })
    expect(Array.isArray(result)).toBe(true)
  }, 30000)

  it('get_list returns a list', async () => {
    if (!ids.listId)
      return expect(true).toBe(true)
    const handler = trello.read('get_list')
    const result = await handler({ listId: ids.listId })
    expect(result?.id).toBe(ids.listId)
  }, 30000)

  it('get_list_cards returns cards in a list', async () => {
    if (!ids.listId)
      return expect(true).toBe(true)
    const handler = trello.read('get_list_cards')
    const result = await handler({ listId: ids.listId })
    expect(Array.isArray(result?.cards)).toBe(true)
  }, 30000)

  it('get_card returns a card', async () => {
    if (!ids.cardId)
      return expect(true).toBe(true)
    const handler = trello.read('get_card')
    const result = await handler({ cardId: ids.cardId })
    expect(result?.id).toBe(ids.cardId)
  }, 30000)

  it('get_card_members returns members for a card', async () => {
    if (!ids.cardId)
      return expect(true).toBe(true)
    const handler = trello.read('get_card_members')
    const result = await handler({ cardId: ids.cardId })
    expect(Array.isArray(result)).toBe(true)
  }, 30000)

  it('get_card_attachments returns attachments for a card', async () => {
    if (!ids.cardId)
      return expect(true).toBe(true)
    const handler = trello.read('get_card_attachments')
    const result = await handler({ cardId: ids.cardId })
    expect(Array.isArray(result)).toBe(true)
  }, 30000)

  it('get_card_actions returns actions for a card', async () => {
    if (!ids.cardId)
      return expect(true).toBe(true)
    const handler = trello.read('get_card_actions')
    const result = await handler({ cardId: ids.cardId })
    expect(Array.isArray(result)).toBe(true)
  }, 30000)

  it('get_card_checklists returns checklists for a card', async () => {
    if (!ids.cardId)
      return expect(true).toBe(true)
    const handler = trello.read('get_card_checklists')
    const result = await handler({ cardId: ids.cardId })
    expect(Array.isArray(result)).toBe(true)
  }, 30000)

  it('get_card_custom_field_items returns custom field items', async () => {
    if (!ids.cardId)
      return expect(true).toBe(true)
    const handler = trello.read('get_card_custom_field_items')
    const result = await handler({ cardId: ids.cardId })
    expect(Array.isArray(result)).toBe(true)
  }, 30000)

  it('get_organization returns an organization', async () => {
    if (!ids.orgId)
      return expect(true).toBe(true)
    const handler = trello.read('get_organization')
    const result = await handler({ orgId: ids.orgId })
    expect(result?.id).toBe(ids.orgId)
  }, 30000)

  it('get_organization_boards returns boards in an org', async () => {
    if (!ids.orgId)
      return expect(true).toBe(true)
    const handler = trello.read('get_organization_boards')
    const result = await handler({ orgId: ids.orgId })
    expect(Array.isArray(result?.boards)).toBe(true)
  }, 30000)

  it('search returns results for a generic query', async () => {
    const handler = trello.read('search')
    const result = await handler({ query: 'test' })
    expect(Array.isArray(result?.boards)).toBe(true)
    expect(Array.isArray(result?.cards)).toBe(true)
  }, 30000)
})
