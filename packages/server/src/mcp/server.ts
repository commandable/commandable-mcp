import type { Implementation } from '@modelcontextprotocol/sdk/types.js'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import type { ExecutableTool } from '../types.js'
import { registerToolHandlers } from './handlers.js'

export interface StdioMcpServerParams {
  serverInfo: Implementation
  tools: { list: Array<{ name: string, description?: string, inputSchema: any }>, byName: Map<string, ExecutableTool> }
}

export async function runStdioMcpServer(params: StdioMcpServerParams): Promise<void> {
  const server = new Server(params.serverInfo, {
    capabilities: {
      tools: {},
    },
  })

  registerToolHandlers(server, params.tools)

  const transport = new StdioServerTransport()
  await server.connect(transport)
}

