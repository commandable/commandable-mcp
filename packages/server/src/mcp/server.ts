import type { Implementation } from '@modelcontextprotocol/sdk/types.js'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import type { ExecutableTool } from '../types.js'
import type { AbilityCatalog } from './abilityCatalog.js'
import type { SessionAbilityState } from './sessionState.js'
import { registerToolHandlers } from './handlers.js'

export interface StdioMcpServerParams {
  serverInfo: Implementation
  tools: { list: Array<{ name: string, description?: string, inputSchema: any }>, byName: Map<string, ExecutableTool> }
  abilityMode?: { catalog: AbilityCatalog, sessionState: SessionAbilityState }
}

export async function runStdioMcpServer(params: StdioMcpServerParams): Promise<void> {
  const server = new Server(params.serverInfo, {
    capabilities: {
      tools: { listChanged: true },
    },
  })

  registerToolHandlers(server, params.tools, params.abilityMode)

  const transport = new StdioServerTransport()
  await server.connect(transport)
}

