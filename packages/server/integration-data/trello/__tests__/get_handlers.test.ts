import { beforeAll, describe, expect, it } from 'vitest'
import { IntegrationProxy } from '../../../src/integrations/proxy.js'
import { loadIntegrationTools } from '../../../src/integrations/dataLoader.js'

// This is a LIVE integration test suite that hits Trello using managed OAuth.
// Required env vars:
// - COMMANDABLE_MANAGED_OAUTH_BASE_URL
// - COMMANDABLE_MANAGED_OAUTH_SECRET_KEY
// - TRELLO_API_KEY
// - TRELLO_TEST_CONNECTION_ID (an existing managed OAuth connectionId for provider 'trello')

interface Ids {
  boardId?: string
  listId?: string
  cardId?: string
  orgId?: string
}

const env = process.env as Record<string, string>
const hasEnv = (...keys: string[]) => keys.every(k => !!env[k] && env[k].trim().length > 0)
const suite = hasEnv(
  'COMMANDABLE_MANAGED_OAUTH_BASE_URL',
  'COMMANDABLE_MANAGED_OAUTH_SECRET_KEY',
  'TRELLO_API_KEY',
  'TRELLO_TEST_CONNECTION_ID',
)
  ? describe
  : describe.skip

suite('trello read handlers (live)', () => {
  const ids: Ids = {}

  let buildHandler: (name: string) => ((input: any) => Promise<any>)

  beforeAll(async () => {
    const { COMMANDABLE_MANAGED_OAUTH_BASE_URL, COMMANDABLE_MANAGED_OAUTH_SECRET_KEY, TRELLO_API_KEY, TRELLO_TEST_CONNECTION_ID } = env

    const proxy = new IntegrationProxy({
      managedOAuthBaseUrl: COMMANDABLE_MANAGED_OAUTH_BASE_URL,
      managedOAuthSecretKey: COMMANDABLE_MANAGED_OAUTH_SECRET_KEY,
      trelloApiKey: TRELLO_API_KEY,
    })
    const integrationNode = { id: 'node-trello', type: 'trello', label: 'Trello', connectionId: TRELLO_TEST_CONNECTION_ID } as any

    const tools = loadIntegrationTools('trello')
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

    // Discover a board, list, card, and org for subsequent tests
    const get_member_boards = buildHandler('get_member_boards')
    const boards = await get_member_boards({})
    expect(Array.isArray(boards)).toBe(true)
    ids.boardId = boards[0]?.id

    if (ids.boardId) {
      const get_board_lists = buildHandler('get_board_lists')
      const lists = await get_board_lists({ boardId: ids.boardId })
      ids.listId = lists[0]?.id

      const get_board_cards = buildHandler('get_board_cards')
      const cards = await get_board_cards({ boardId: ids.boardId })
      ids.cardId = cards[0]?.id
    }

    const get_member_organizations = buildHandler('get_member_organizations')
    const orgs = await get_member_organizations({})
    ids.orgId = orgs[0]?.id
  }, 60000)

  it('get_member returns current member', async () => {
    const handler = buildHandler('get_member')
    const result = await handler({})
    expect(result).toBeTruthy()
    expect(typeof result.id).toBe('string')
    expect(typeof result.username).toBe('string')
  }, 30000)

  it('get_member_boards returns an array', async () => {
    const handler = buildHandler('get_member_boards')
    const result = await handler({})
    expect(Array.isArray(result)).toBe(true)
  }, 30000)

  it('get_member_organizations returns an array', async () => {
    const handler = buildHandler('get_member_organizations')
    const result = await handler({})
    expect(Array.isArray(result)).toBe(true)
  }, 30000)

  it('get_board works with boardId', async () => {
    if (!ids.boardId)
      return expect(true).toBe(true)
    const handler = buildHandler('get_board')
    const result = await handler({ boardId: ids.boardId })
    expect(result?.id).toBe(ids.boardId)
  }, 30000)

  it('get_board_lists returns lists', async () => {
    if (!ids.boardId)
      return expect(true).toBe(true)
    const handler = buildHandler('get_board_lists')
    const result = await handler({ boardId: ids.boardId })
    expect(Array.isArray(result)).toBe(true)
  }, 30000)

  it('get_board_cards returns cards', async () => {
    if (!ids.boardId)
      return expect(true).toBe(true)
    const handler = buildHandler('get_board_cards')
    const result = await handler({ boardId: ids.boardId })
    expect(Array.isArray(result)).toBe(true)
  }, 30000)

  it('get_board_members returns members', async () => {
    if (!ids.boardId)
      return expect(true).toBe(true)
    const handler = buildHandler('get_board_members')
    const result = await handler({ boardId: ids.boardId })
    expect(Array.isArray(result)).toBe(true)
  }, 30000)

  it('get_board_labels returns labels', async () => {
    if (!ids.boardId)
      return expect(true).toBe(true)
    const handler = buildHandler('get_board_labels')
    const result = await handler({ boardId: ids.boardId })
    expect(Array.isArray(result)).toBe(true)
  }, 30000)

  it('get_board_custom_fields returns custom fields', async () => {
    if (!ids.boardId)
      return expect(true).toBe(true)
    const handler = buildHandler('get_board_custom_fields')
    const result = await handler({ boardId: ids.boardId })
    expect(Array.isArray(result)).toBe(true)
  }, 30000)

  it('get_board_memberships returns memberships', async () => {
    if (!ids.boardId)
      return expect(true).toBe(true)
    const handler = buildHandler('get_board_memberships')
    const result = await handler({ boardId: ids.boardId })
    expect(Array.isArray(result)).toBe(true)
  }, 30000)

  it('get_list returns a list', async () => {
    if (!ids.listId)
      return expect(true).toBe(true)
    const handler = buildHandler('get_list')
    const result = await handler({ listId: ids.listId })
    expect(result?.id).toBe(ids.listId)
  }, 30000)

  it('get_list_cards returns cards in a list', async () => {
    if (!ids.listId)
      return expect(true).toBe(true)
    const handler = buildHandler('get_list_cards')
    const result = await handler({ listId: ids.listId })
    expect(Array.isArray(result)).toBe(true)
  }, 30000)

  it('get_card returns a card', async () => {
    if (!ids.cardId)
      return expect(true).toBe(true)
    const handler = buildHandler('get_card')
    const result = await handler({ cardId: ids.cardId })
    expect(result?.id).toBe(ids.cardId)
  }, 30000)

  it('get_card_members returns members for a card', async () => {
    if (!ids.cardId)
      return expect(true).toBe(true)
    const handler = buildHandler('get_card_members')
    const result = await handler({ cardId: ids.cardId })
    expect(Array.isArray(result)).toBe(true)
  }, 30000)

  it('get_card_attachments returns attachments for a card', async () => {
    if (!ids.cardId)
      return expect(true).toBe(true)
    const handler = buildHandler('get_card_attachments')
    const result = await handler({ cardId: ids.cardId })
    expect(Array.isArray(result)).toBe(true)
  }, 30000)

  it('get_card_actions returns actions for a card', async () => {
    if (!ids.cardId)
      return expect(true).toBe(true)
    const handler = buildHandler('get_card_actions')
    const result = await handler({ cardId: ids.cardId })
    expect(Array.isArray(result)).toBe(true)
  }, 30000)

  it('get_card_checklists returns checklists for a card', async () => {
    if (!ids.cardId)
      return expect(true).toBe(true)
    const handler = buildHandler('get_card_checklists')
    const result = await handler({ cardId: ids.cardId })
    expect(Array.isArray(result)).toBe(true)
  }, 30000)

  it('get_card_custom_field_items returns custom field items', async () => {
    if (!ids.cardId)
      return expect(true).toBe(true)
    const handler = buildHandler('get_card_custom_field_items')
    const result = await handler({ cardId: ids.cardId })
    expect(Array.isArray(result)).toBe(true)
  }, 30000)

  it('get_organization returns an organization', async () => {
    if (!ids.orgId)
      return expect(true).toBe(true)
    const handler = buildHandler('get_organization')
    const result = await handler({ orgId: ids.orgId })
    expect(result?.id).toBe(ids.orgId)
  }, 30000)

  it('get_organization_boards returns boards in an org', async () => {
    if (!ids.orgId)
      return expect(true).toBe(true)
    const handler = buildHandler('get_organization_boards')
    const result = await handler({ orgId: ids.orgId })
    expect(Array.isArray(result)).toBe(true)
  }, 30000)

  it('search returns results for a generic query', async () => {
    const handler = buildHandler('search')
    const result = await handler({ query: 'test' })
    expect(result).toBeTruthy()
  }, 30000)
})
