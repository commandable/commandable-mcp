import type { ExecutableTool, IntegrationData, ToolDefinition, ToolScope } from '../types.js'
import type { IntegrationProxy } from './proxy.js'
import { loadIntegrationTools } from './dataLoader.js'
import { makeIntegrationToolName, sanitizeJsonSchema } from './tools.js'
import { createSafeHandlerFromString } from './sandbox.js'
import { createGetIntegration } from './getIntegration.js'
import { buildSandboxUtils } from './sandboxUtils.js'

type Scope = 'read' | 'write' | 'admin'

export interface BuildToolsOptions {
  requireWriteConfirmation?: boolean
  integrationsRef?: { current: IntegrationData[] }
  toolDefinitions?: ToolDefinition[]
}

export function buildToolsByIntegration(
  spaceId: string,
  integrations: IntegrationData[],
  proxy: IntegrationProxy,
  opts: BuildToolsOptions = {},
): Record<string, { read: ExecutableTool[], write: ExecutableTool[], admin: ExecutableTool[] }> {
  const { requireWriteConfirmation = false, integrationsRef, toolDefinitions } = opts
  const getIntegration = createGetIntegration(integrationsRef || { current: integrations }, proxy)
  const toolsByIntegration: Record<string, { read: ExecutableTool[], write: ExecutableTool[], admin: ExecutableTool[] }> = {}

  for (const integ of integrations) {
    if (integ.enabled === false)
      continue

    const humanize = (s: string) => (s || '')
      .replace(/_/g, ' ')
      .split(/\s+/g)
      .filter(Boolean)
      .map(w => w.length ? `${w[0]!.toUpperCase()}${w.slice(1).toLowerCase()}` : w)
      .join(' ')

    const loaded = loadIntegrationTools(integ.type, {
      credentialVariant: integ.credentialVariant ?? undefined,
      toolsets: integ.enabledToolsets ?? undefined,
      maxScope: integ.maxScope ?? undefined,
      disabledTools: integ.disabledTools ?? undefined,
    })
    const readBuiltIn = loaded?.read || []
    const writeBuiltIn = loaded?.write || []
    const adminBuiltIn = loaded?.admin || []

    const dbDefsForIntegration = (toolDefinitions || []).filter(t => t.integrationId === integ.id)
    const readDb = dbDefsForIntegration.filter(t => t.scope === 'read')
    const writeDb = dbDefsForIntegration.filter(t => t.scope === 'write')
    const adminDb = dbDefsForIntegration.filter(t => t.scope === 'admin')

    const buildActions = (arr: any[], scope: Scope): ExecutableTool[] => arr.map((t) => {
      const rawSchema = typeof t.inputSchema === 'string' ? JSON.parse(t.inputSchema) : t.inputSchema
      const schemaObj = sanitizeJsonSchema(rawSchema)
      const toolName = makeIntegrationToolName(integ.type, t.name, integ.id)
      const description = `[${integ.label} | ${integ.type}] ${t.description}`

      const wrapper = `async (input) => {\n  const integration = getIntegration('${integ.id}');\n  const __inner = ${t.handlerCode};\n  return await __inner(input);\n}`
      const utils = buildSandboxUtils(Array.isArray(t.utils) ? t.utils : undefined)
      const safeHandler = createSafeHandlerFromString(wrapper, getIntegration, utils)
      return {
        name: toolName,
        displayName: `${t.displayName || humanize(t.name)}`,
        description,
        inputSchema: schemaObj,
        run: safeHandler,
        integrations: [integ],
        requireConfirmation: scope === 'write' && requireWriteConfirmation,
      }
    })

    const buildActionsFromToolDefinitions = (defs: ToolDefinition[], scope: ToolScope): ExecutableTool[] => defs.map((t) => {
      const schemaObj = sanitizeJsonSchema(t.inputSchema)
      const toolName = makeIntegrationToolName(integ.type, t.name, integ.id)
      const description = `[${integ.label} | ${integ.type}] ${t.description}`
      const wrapper = `async (input) => {\n  const integration = getIntegration('${integ.id}');\n  const __inner = ${t.handlerCode};\n  return await __inner(input);\n}`
      const utils = buildSandboxUtils(Array.isArray(t.utils) ? t.utils : undefined)
      const safeHandler = createSafeHandlerFromString(wrapper, getIntegration, utils)
      return {
        name: toolName,
        displayName: `${t.displayName || humanize(String(t.name || 'tool'))}`,
        description,
        inputSchema: schemaObj,
        run: safeHandler,
        integrations: [integ],
        requireConfirmation: scope === 'write' && requireWriteConfirmation,
      }
    })

    toolsByIntegration[integ.referenceId] = {
      read: [...buildActions(readBuiltIn, 'read'), ...buildActionsFromToolDefinitions(readDb, 'read')],
      write: [...buildActions(writeBuiltIn, 'write'), ...buildActionsFromToolDefinitions(writeDb, 'write')],
      admin: [...buildActions(adminBuiltIn, 'admin'), ...buildActionsFromToolDefinitions(adminDb, 'admin')],
    }
  }

  return toolsByIntegration
}
