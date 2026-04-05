import { describe, expect, it, vi } from 'vitest'
import { loadIntegrationManifest } from '../integrations/dataLoader.js'
import { createSafeHandlerFromString } from '../integrations/sandbox.js'

describe('variantConfig list handlers', () => {
  it('runs trello-board picker handlers and normalizes id/name options', async () => {
    const manifest = loadIntegrationManifest('trello-board')
    const boardPicker = manifest?.variantConfig?.find(item => item.key === 'board')

    expect(boardPicker?.selectionMode).toBe('single')
    expect(boardPicker?.listHandler).toBeTruthy()

    const fetch = vi.fn(async () => ({
      json: async () => [
        { id: 'board-2', name: 'Beta', closed: true, starred: false },
        { id: 'board-1', name: 'Alpha', closed: false, starred: true },
      ],
    }))

    const getIntegration = () => ({
      fetch,
    })

    const runner = createSafeHandlerFromString(
      `async (config) => {
        const integration = getIntegration('integration-1');
        const __handler = ${boardPicker!.listHandler};
        return await __handler(config);
      }`,
      getIntegration,
    )

    const result = await runner({})

    expect(result.success).toBe(true)
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(result.result).toEqual([
      { id: 'board-1', name: 'Alpha' },
      { id: 'board-2', name: 'Beta' },
    ])
  })
})
