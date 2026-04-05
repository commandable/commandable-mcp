import { describe, expect, it } from 'vitest'
import { loadIntegrationCredentialConfig, loadIntegrationManifest, loadIntegrationTools } from '../../../../../src/loader.ts'

describe('trello-board manifest', () => {
  it('inherits trello provider metadata and exposes board variant config', () => {
    const manifest = loadIntegrationManifest('trello-board')
    expect(manifest?.name).toBe('Trello')
    expect(manifest?.variantLabel).toBe('Single board')
    expect(manifest?.variantConfig).toEqual([
      expect.objectContaining({
        key: 'board',
        label: 'Board',
        selectionMode: 'single',
        listHandler: expect.any(String),
      }),
    ])
  })

  it('inherits trello credentials from the parent integration', () => {
    const credentials = loadIntegrationCredentialConfig('trello-board')
    expect(credentials?.variantKey).toBe('api_key_token')
    expect(credentials?.label).toBe('API Key + Token')
    expect(credentials?.injection.query).toMatchObject({
      key: '{{apiKey}}',
      token: '{{apiToken}}',
    })
  })

  it('uses empty input schemas and config injection for board-bound tools', () => {
    const tools = loadIntegrationTools('trello-board')
    expect(tools).toBeTruthy()

    const readTools = tools?.read ?? []
    const getLists = readTools.find(tool => tool.name === 'get_lists')
    const getCards = readTools.find(tool => tool.name === 'get_cards')

    expect(getLists?.inputSchema).toEqual({ type: 'object', properties: {}, additionalProperties: false })
    expect(getCards?.inputSchema).toEqual({ type: 'object', properties: {}, additionalProperties: false })
    expect(getLists?.injectFromConfig).toEqual({ boardId: 'boardId' })
    expect(getCards?.injectFromConfig).toEqual({ boardId: 'boardId' })
  })

  it('removes injected board ids from inherited write schemas', () => {
    const tools = loadIntegrationTools('trello-board')
    const writeTools = tools?.write ?? []
    const createList = writeTools.find(tool => tool.name === 'create_list')

    expect(createList?.inputSchema).toMatchObject({
      type: 'object',
      required: ['name'],
    })
    expect(createList?.inputSchema).not.toMatchObject({
      required: expect.arrayContaining(['idBoard']),
    })
    expect(createList?.inputSchema).toMatchObject({
      properties: {
        name: { type: 'string' },
      },
    })
    expect((createList?.inputSchema as any)?.properties?.idBoard).toBeUndefined()
    expect(createList?.injectFromConfig).toEqual({ idBoard: 'boardId' })
  })

  it('keeps list/card detail tools available with their original schemas', () => {
    const tools = loadIntegrationTools('trello-board')
    const readTools = tools?.read ?? []

    const getCard = readTools.find(tool => tool.name === 'get_card')
    const getList = readTools.find(tool => tool.name === 'get_list')

    expect(getCard?.inputSchema).toMatchObject({
      type: 'object',
      required: ['cardId'],
    })
    expect(getList?.inputSchema).toMatchObject({
      type: 'object',
      required: ['listId'],
    })
  })
})
