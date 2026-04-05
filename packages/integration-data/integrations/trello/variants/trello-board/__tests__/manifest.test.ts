import { describe, expect, it } from 'vitest'
import { loadIntegrationManifest, loadIntegrationTools } from '../../../../../src/loader.ts'

describe('trello-board manifest', () => {
  it('declares trello as its parent variant family', () => {
    const manifest = loadIntegrationManifest('trello-board')
    expect(manifest?.name).toBe('Trello')
    expect(manifest?.parent).toBe('trello')
    expect(manifest?.variantLabel).toBe('Single board')
    expect(manifest?.connectionConfig?.schema).toBeTruthy()
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
