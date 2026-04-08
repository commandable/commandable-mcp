import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import type { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { getHoistedArtifacts } from '../toolResults.js'
import type { ExecutableTool, ToolRunResult } from '../types.js'
import { getMetaToolDefinitions, getReadmeToolDefinition, handleMetaToolCall, handleStaticReadmeCall } from './metaTools.js'
import type { DynamicModeContext, McpServerMode } from './server.js'

export interface ToolIndex {
  list: Array<{ name: string, description?: string, inputSchema: any }>
  byName: Map<string, ExecutableTool>
}

export interface RegisterToolHandlersOptions {
  mode: McpServerMode
  dynamicMode?: DynamicModeContext
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

function renderArtifact(artifact: ReturnType<typeof getHoistedArtifacts>[number]): Array<{ type: 'text', text: string } | { type: 'image', data: string, mimeType: string }> {
  if (artifact.type === 'image' && artifact.data) {
    return [{
      type: 'image',
      data: artifact.data,
      mimeType: artifact.mimeType,
    }]
  }

  if (artifact.type === 'image' && artifact.url) {
    return [{
      type: 'text',
      text: `Image artifact URL (${artifact.mimeType}): ${artifact.url}`,
    }]
  }

  return []
}

function buildToolSuccessContent(res: ToolRunResult): Array<{ type: 'text', text: string } | { type: 'image', data: string, mimeType: string }> {
  const artifacts = getHoistedArtifacts(res)

  return [
    { type: 'text', text: formatAsText(res.result) },
    ...artifacts.flatMap(renderArtifact),
    ...(res.logs?.length ? [{ type: 'text' as const, text: `Logs:\n${res.logs.join('\n')}` }] : []),
  ]
}

export function registerToolHandlers(
  server: Server,
  tools: ToolIndex,
  options: RegisterToolHandlersOptions = { mode: 'static' },
): void {
  const metaToolDefs = getMetaToolDefinitions()
  const { mode, dynamicMode } = options
  const usesDynamicToolLoading = mode !== 'static'

  if (usesDynamicToolLoading && !dynamicMode)
    throw new Error(`Dynamic MCP mode requires dynamicMode context. Received mode: ${mode}`)

  const resolvedDynamicMode = dynamicMode

  const readmeToolDef = getReadmeToolDefinition()

  server.setRequestHandler(ListToolsRequestSchema, async (_req, extra) => {
    if (!usesDynamicToolLoading)
      return { tools: [readmeToolDef, ...tools.list] }

    const sessionId = extra?.sessionId
    const active = resolvedDynamicMode!.sessionState.getActiveToolNames(sessionId)
    const toolDefs = resolvedDynamicMode!.catalogRef.current.getToolDefinitions([...active])
    return { tools: [...metaToolDefs, ...toolDefs] }
  })

  server.setRequestHandler(CallToolRequestSchema, async (req, extra) => {
    const name = req.params.name
    const args = (req.params.arguments ?? {}) as any
    const sessionId = extra?.sessionId

    if (usesDynamicToolLoading) {
      const metaRes = await handleMetaToolCall({
        name,
        args,
        sessionId,
        catalog: resolvedDynamicMode!.catalogRef.current,
        sessionState: resolvedDynamicMode!.sessionState,
        ctx: resolvedDynamicMode!.ctx,
      })

      if (metaRes.handled) {
        if (metaRes.listChanged) {
          await server.sendToolListChanged()
        }
        return {
          content: [{ type: 'text', text: formatAsText(metaRes.result) }],
        }
      }

      if (!resolvedDynamicMode!.sessionState.isToolActive(sessionId, name)) {
        throw new Error(
          `Tool not enabled in this session: ${name}. Use ${metaToolDefs[0]!.name} + ${metaToolDefs[1]!.name} to enable a toolset first.`,
        )
      }

      const tool = resolvedDynamicMode!.catalogRef.current.getExecutableTool(name)
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
        content: buildToolSuccessContent(res),
      }
    }

    const staticMeta = handleStaticReadmeCall(name)
    if (staticMeta.handled) {
      return {
        content: [{ type: 'text', text: formatAsText(staticMeta.result) }],
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
      content: buildToolSuccessContent(res),
    }
  })
}

