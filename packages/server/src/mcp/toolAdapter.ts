import type { JSONSchema7 } from 'json-schema'
import type { ExecutableTool, IntegrationData } from '../types.js'
import type { IntegrationProxy } from '../integrations/proxy.js'
import { buildToolsByIntegration } from '../integrations/actionsFactory.js'

export interface McpToolDefinition {
  name: string
  description?: string
  inputSchema: JSONSchema7
  // annotations intentionally omitted for v1
}

export function buildMcpToolIndex(params: {
  spaceId: string
  integrations: IntegrationData[]
  proxy: IntegrationProxy
}): { tools: McpToolDefinition[], byName: Map<string, ExecutableTool> } {
  const toolsByIntegration = buildToolsByIntegration(params.spaceId, params.integrations, params.proxy)

  const byName = new Map<string, ExecutableTool>()
  const tools: McpToolDefinition[] = []

  for (const group of Object.values(toolsByIntegration)) {
    for (const t of [...group.read, ...group.write, ...group.admin]) {
      byName.set(t.name, t)
      tools.push({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
      })
    }
  }

  return { tools, byName }
}

