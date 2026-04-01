import type { ExecutableTool, IntegrationData, ToolDefinition, ToolScope } from '../types.js'
import type { IntegrationProxy } from './proxy.js'
import { createSafeHandlerFromString } from './sandbox.js'
import { createGetIntegration } from './getIntegration.js'
import { makeIntegrationToolName, sanitizeJsonSchema } from './tools.js'
import { resolveSandboxUtils } from './sandboxUtils.js'

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
  /**
   * When set, full sandbox `utils` for this tool (same replace semantics as
   * `buildToolsByIntegration` opts.utils). When omitted, uses tool manifest bundles only.
   */
  utils?: Record<string, unknown>
}): ExecutableTool {
  const { integration, tool, proxy, integrationsRef, requireWriteConfirmation = false, utils: injectUtils } = params

  const getIntegration = createGetIntegration(integrationsRef || { current: [integration] }, proxy)
  const scope: ToolScope = tool.scope || 'write'

  const toolName = makeIntegrationToolName(integration.type, tool.name, integration.id)
  const description = `[${integration.label} | ${integration.type}] ${tool.description || tool.displayName || tool.name}`
  const inputSchema = sanitizeJsonSchema(tool.inputSchema || { type: 'object', additionalProperties: true })

  const wrapper = `async (input) => {\n  const integration = getIntegration('${integration.id}');\n  const __inner = ${tool.handlerCode};\n  return await __inner(input);\n}`
  const resolvedUtils = resolveSandboxUtils(Array.isArray(tool.utils) ? tool.utils : undefined, injectUtils)
  const safeHandler = createSafeHandlerFromString(wrapper, getIntegration, resolvedUtils)

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

