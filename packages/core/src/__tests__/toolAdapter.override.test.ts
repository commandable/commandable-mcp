import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ExecutableTool } from '../types.js'
import { buildToolsByIntegration } from '../integrations/executableToolFactory.js'
import { buildMcpToolIndex } from '../mcp/toolAdapter.js'

vi.mock('../integrations/executableToolFactory.js', () => ({
  buildToolsByIntegration: vi.fn(),
}))

const mockedBuildToolsByIntegration = vi.mocked(buildToolsByIntegration)

function makeTool(name: string, description: string): ExecutableTool {
  return {
    name,
    displayName: name,
    description,
    inputSchema: { type: 'object', additionalProperties: false },
    run: vi.fn(),
  }
}

describe('buildMcpToolIndex', () => {
  beforeEach(() => {
    mockedBuildToolsByIntegration.mockReset()
  })

  it('publishes unique tool names even if duplicate executables are returned', () => {
    mockedBuildToolsByIntegration.mockReturnValue({
      google_workspace_primary: {
        read: [makeTool('google-workspace__read_file_content__nintegrat', 'Manifest reader')],
        write: [makeTool('google-workspace__read_file_content__nintegrat', 'Override reader')],
        admin: [],
      },
    } as any)

    const index = buildMcpToolIndex({
      spaceId: 'space-1',
      integrations: [],
      proxy: {} as any,
    })

    expect(index.tools).toEqual([
      expect.objectContaining({
        name: 'google-workspace__read_file_content__nintegrat',
        description: 'Override reader',
      }),
    ])
    expect(index.byName.get('google-workspace__read_file_content__nintegrat')?.description).toBe('Override reader')
  })
})
