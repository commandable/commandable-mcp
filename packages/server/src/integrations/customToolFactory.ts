import type { ExecutableTool, IntegrationData, ToolDefinition, ToolScope } from '../types.js'
import type { IntegrationProxy } from './proxy.js'
import { createSafeHandlerFromString } from './sandbox.js'
import { createGetIntegration } from './getIntegration.js'
import { makeIntegrationToolName, sanitizeJsonSchema } from './tools.js'

function humanize(s: string): string {
  return (s || '')
    .replace(/_/g, ' ')
    .split(/\s+/g)
    .filter(Boolean)
    .map(w => w.length ? `${w[0]!.toUpperCase()}${w.slice(1).toLowerCase()}` : w)
    .join(' ')
}

export function buildExecutableToolFromDefinition(params: {
  spaceId: string
  integration: IntegrationData
  tool: ToolDefinition
  proxy: IntegrationProxy
  integrationsRef?: { current: IntegrationData[] }
  requireWriteConfirmation?: boolean
}): ExecutableTool {
  const { integration, tool, proxy, integrationsRef, requireWriteConfirmation = false } = params

  const getIntegration = createGetIntegration(integrationsRef || { current: [integration] }, proxy)
  const scope: ToolScope = tool.scope || 'write'

  const toolName = makeIntegrationToolName(integration.type, tool.name, integration.id)
  const description = `[${integration.label} | ${integration.type}] ${tool.description || tool.displayName || tool.name}`
  const inputSchema = sanitizeJsonSchema(tool.inputSchema || { type: 'object', additionalProperties: true })

  const wrapper = `async (input) => {\n  const integration = getIntegration('${integration.id}');\n  const __inner = ${tool.handlerCode};\n  return await __inner(input);\n}`
  const safeHandler = createSafeHandlerFromString(wrapper, getIntegration)

  return {
    name: toolName,
    displayName: `${tool.displayName || humanize(tool.name)}`,
    description,
    inputSchema,
    run: safeHandler,
    integrations: [integration],
    requireConfirmation: scope === 'write' && requireWriteConfirmation,
  }
}

