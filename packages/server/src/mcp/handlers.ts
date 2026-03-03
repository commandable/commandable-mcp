import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import type { Server } from '@modelcontextprotocol/sdk/server/index.js'
import type { ExecutableTool } from '../types.js'
import type { AbilityCatalog } from './abilityCatalog.js'
import type { SessionAbilityState } from './sessionState.js'
import { getMetaToolDefinitions, handleMetaToolCall } from './metaTools.js'
import type { MetaToolContext } from './metaTools.js'

export interface ToolIndex {
  list: Array<{ name: string, description?: string, inputSchema: any }>
  byName: Map<string, ExecutableTool>
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

export function registerToolHandlers(
  server: Server,
  tools: ToolIndex,
  createMode?: { catalogRef: { current: AbilityCatalog }, sessionState: SessionAbilityState, ctx?: MetaToolContext },
): void {
  const metaToolDefs = getMetaToolDefinitions()

  server.setRequestHandler(ListToolsRequestSchema, async (_req, extra) => {
    if (!createMode)
      return { tools: tools.list }

    const sessionId = extra?.sessionId
    const active = createMode.sessionState.getActiveToolNames(sessionId)
    const toolDefs = createMode.catalogRef.current.getToolDefinitions([...active])
    return { tools: [...metaToolDefs, ...toolDefs] }
  })

  server.setRequestHandler(CallToolRequestSchema, async (req, extra) => {
    const name = req.params.name
    const args = (req.params.arguments ?? {}) as any
    const sessionId = extra?.sessionId

    if (createMode) {
      const metaRes = await handleMetaToolCall({
        name,
        args,
        sessionId,
        catalog: createMode.catalogRef.current,
        sessionState: createMode.sessionState,
        ctx: createMode.ctx,
      })

      if (metaRes.handled) {
        if (metaRes.listChanged) {
          await server.sendToolListChanged()
        }
        return {
          content: [{ type: 'text', text: formatAsText(metaRes.result) }],
        }
      }

      if (!createMode.sessionState.isToolActive(sessionId, name)) {
        throw new Error(
          `Tool not enabled in this session: ${name}. Use ${metaToolDefs[0]!.name} + ${metaToolDefs[1]!.name} to enable a toolset first.`,
        )
      }

      const tool = createMode.catalogRef.current.getExecutableTool(name)
      if (!tool)
        throw new Error(`Unknown tool: ${name}`)

      const res = await tool.run(args)

      if (!res.success) {
        return {
          content: [
            { type: 'text', text: `Tool error: ${formatAsText(res.result)}` },
            ...(res.logs?.length ? [{ type: 'text', text: `Logs:\n${res.logs.join('\n')}` }] : []),
          ],
        }
      }

      return {
        content: [
          { type: 'text', text: formatAsText(res.result) },
          ...(res.logs?.length ? [{ type: 'text', text: `Logs:\n${res.logs.join('\n')}` }] : []),
        ],
      }
    }

    const tool = tools.byName.get(name)
    if (!tool)
      throw new Error(`Unknown tool: ${name}`)

    const res = await tool.run(args)

    if (!res.success) {
      return {
        content: [
          { type: 'text', text: `Tool error: ${formatAsText(res.result)}` },
          ...(res.logs?.length ? [{ type: 'text', text: `Logs:\n${res.logs.join('\n')}` }] : []),
        ],
      }
    }

    return {
      content: [
        { type: 'text', text: formatAsText(res.result) },
        ...(res.logs?.length ? [{ type: 'text', text: `Logs:\n${res.logs.join('\n')}` }] : []),
      ],
    }
  })
}

