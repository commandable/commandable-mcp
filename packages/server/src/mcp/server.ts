import type { Implementation } from '@modelcontextprotocol/sdk/types.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import type { ExecutableTool } from '../types.js'

export interface StdioMcpServerParams {
  serverInfo: Implementation
  tools: { list: Array<{ name: string, description?: string, inputSchema: any }>, byName: Map<string, ExecutableTool> }
}

function formatAsText(value: any): string {
  if (typeof value === 'string')
    return value
  try {
    return JSON.stringify(value, null, 2)
  }
  catch {
    return String(value)
  }
}

export async function runStdioMcpServer(params: StdioMcpServerParams): Promise<void> {
  const server = new Server(params.serverInfo, {
    capabilities: {
      tools: {},
    },
  })

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: params.tools.list,
    }
  })

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const name = req.params.name
    const args = (req.params.arguments ?? {}) as any
    const tool = params.tools.byName.get(name)
    if (!tool)
      throw new Error(`Unknown tool: ${name}`)

    const res = await tool.run(args)

    if (!res.success) {
      return {
        content: [
          { type: 'text', text: `Tool error: ${formatAsText(res.result)}` },
          ...(res.logs?.length ? [{ type: 'text', text: `Logs:\\n${res.logs.join('\\n')}` }] : []),
        ],
      }
    }

    return {
      content: [
        { type: 'text', text: formatAsText(res.result) },
        ...(res.logs?.length ? [{ type: 'text', text: `Logs:\\n${res.logs.join('\\n')}` }] : []),
      ],
    }
  })

  const transport = new StdioServerTransport()
  await server.connect(transport)
}

