import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { IntegrationData } from '../types.js'
import * as dataLoader from '../integrations/dataLoader.js'
import { buildToolsByIntegration } from '../integrations/executableToolFactory.js'

vi.mock('../integrations/dataLoader.js', () => ({
  loadIntegrationTools: vi.fn(),
}))

const mockedLoadIntegrationTools = vi.mocked(dataLoader.loadIntegrationTools)

function makeIntegration(overrides: Partial<IntegrationData> = {}): IntegrationData {
  return {
    id: 'integration-1',
    referenceId: 'trello_board_primary',
    type: 'trello-board',
    label: 'Trello: Marketing',
    enabled: true,
    connectionId: 'connection-1',
    config: {
      boardId: 'board-123',
      boardName: 'Marketing',
    },
    ...overrides,
  }
}

describe('buildToolsByIntegration config injection', () => {
  beforeEach(() => {
    mockedLoadIntegrationTools.mockReset()
  })

  it('injects configured values into built-in handler inputs', async () => {
    mockedLoadIntegrationTools.mockReturnValue({
      read: [{
        name: 'get_lists',
        description: 'List lists on the connected board.',
        inputSchema: { type: 'object', additionalProperties: false },
        injectFromConfig: { boardId: 'boardId' },
        handlerCode: `async (input) => input`,
      }],
      write: [],
      admin: [],
    } as any)

    const built = buildToolsByIntegration('space-1', [makeIntegration()], {} as any)
    const tools = built.trello_board_primary?.read || []
    expect(tools).toHaveLength(1)

    const output = await tools[0]!.run({})
    expect(output.success).toBe(true)
    expect(output.result).toEqual({ boardId: 'board-123' })
  })

  it('prefers configured values over user-supplied values for injected keys', async () => {
    mockedLoadIntegrationTools.mockReturnValue({
      read: [{
        name: 'get_lists',
        description: 'List lists on the connected board.',
        inputSchema: { type: 'object', additionalProperties: true },
        injectFromConfig: { boardId: 'boardId' },
        handlerCode: `async (input) => input`,
      }],
      write: [],
      admin: [],
    } as any)

    const built = buildToolsByIntegration('space-1', [makeIntegration()], {} as any)
    const tools = built.trello_board_primary?.read || []

    const output = await tools[0]!.run({ boardId: 'user-supplied', extra: true })
    expect(output.success).toBe(true)
    expect(output.result).toEqual({ boardId: 'board-123', extra: true })
  })
})
