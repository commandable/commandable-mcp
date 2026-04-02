import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { IntegrationData, ToolDefinition } from '../types.js'
import * as dataLoader from '../integrations/dataLoader.js'
import { buildToolsByIntegration } from '../integrations/executableToolFactory.js'

vi.mock('../integrations/dataLoader.js', () => ({
  loadIntegrationTools: vi.fn(),
}))

const mockedLoadIntegrationTools = vi.mocked(dataLoader.loadIntegrationTools)

function makeIntegration(overrides: Partial<IntegrationData> = {}): IntegrationData {
  return {
    id: 'integration-1',
    referenceId: 'google_drive_primary',
    type: 'google-drive',
    label: 'Google Drive',
    enabled: true,
    connectionId: 'connection-1',
    ...overrides,
  }
}

function makeToolDefinition(overrides: Partial<ToolDefinition> = {}): ToolDefinition {
  return {
    integrationId: 'integration-1',
    name: 'read_file_content',
    description: 'Override reader',
    scope: 'read',
    inputSchema: { type: 'object', additionalProperties: false },
    handlerCode: `async () => ({ source: 'override' })`,
    ...overrides,
  }
}

describe('buildToolsByIntegration override precedence', () => {
  beforeEach(() => {
    mockedLoadIntegrationTools.mockReset()
    mockedLoadIntegrationTools.mockReturnValue({ read: [], write: [], admin: [] } as any)
  })

  it('prefers tool definitions over manifest tools with the same name', async () => {
    mockedLoadIntegrationTools.mockReturnValue({
      read: [{
        name: 'read_file_content',
        description: 'Manifest reader',
        inputSchema: { type: 'object', additionalProperties: false },
        handlerCode: `async () => ({ source: 'manifest' })`,
      }],
      write: [],
      admin: [],
    } as any)

    const built = buildToolsByIntegration(
      'space-1',
      [makeIntegration()],
      {} as any,
      { toolDefinitions: [makeToolDefinition()] },
    )

    const tools = built.google_drive_primary?.read || []
    expect(tools).toHaveLength(1)
    expect(tools[0]?.description).toContain('Override reader')

    const output = await tools[0]!.run({})
    expect(output.success).toBe(true)
    expect(output.result).toEqual({ source: 'override' })
  })

  it('uses the last tool definition when host definitions collide by name', async () => {
    const built = buildToolsByIntegration(
      'space-1',
      [makeIntegration()],
      {} as any,
      {
        toolDefinitions: [
          makeToolDefinition({ description: 'Earlier override', handlerCode: `async () => ({ source: 'first' })` }),
          makeToolDefinition({ description: 'Later override', handlerCode: `async () => ({ source: 'second' })` }),
        ],
      },
    )

    const tools = built.google_drive_primary?.read || []
    expect(tools).toHaveLength(1)
    expect(tools[0]?.description).toContain('Later override')

    const output = await tools[0]!.run({})
    expect(output.success).toBe(true)
    expect(output.result).toEqual({ source: 'second' })
  })
})
