import type { ExecutableTool, IntegrationData, ToolDefinition, ToolScope } from '../types.js'
import type { IntegrationProxy } from './proxy.js'
import { loadIntegrationTools } from './dataLoader.js'
import { makeIntegrationToolName, sanitizeJsonSchema } from './tools.js'
import { createSafeHandlerFromString } from './sandbox.js'
import { createGetIntegration } from './getIntegration.js'
import { buildSandboxUtils } from './sandboxUtils.js'
import { createExtractFileContent } from './fileExtractor.js'

type Scope = 'read' | 'write' | 'admin'

export interface BuildToolsOptions {
  requireWriteConfirmation?: boolean
  integrationsRef?: { current: IntegrationData[] }
  toolDefinitions?: ToolDefinition[]
  /**
   * When set, becomes the **full** sandbox `utils` for every tool (host composes e.g. with
   * `buildSandboxUtils` from `@commandable/mcp-core`). When omitted, each tool uses only its
   * manifest `utils` bundles (html/adf) via {@link resolveSandboxUtils}.
   */
  utils?: Record<string, unknown>
}

function dedupeToolDefinitionsByName(definitions: ToolDefinition[]): ToolDefinition[] {
  if (definitions.length <= 1)
    return definitions

  const deduped = new Map<string, ToolDefinition>()
  for (const definition of definitions)
    deduped.set(definition.name, definition)
  return [...deduped.values()]
}

function filterBuiltInToolsForOverrides<T extends { name: string }>(
  builtInTools: T[],
  definitions: ToolDefinition[],
): T[] {
  if (!builtInTools.length || !definitions.length)
    return builtInTools

  const overridingNames = new Set(definitions.map(definition => definition.name))
  return builtInTools.filter(tool => !overridingNames.has(tool.name))
}

function buildHandlerWrapper(
  integrationId: string,
  handlerCode: string,
  integrationConfig: Record<string, unknown> | null | undefined,
  injectFromConfig?: Record<string, string>,
): string {
  const serializedConfig = JSON.stringify(integrationConfig ?? {})
  const serializedMapping = JSON.stringify(injectFromConfig ?? {})

  return `async (input) => {\n  const integration = getIntegration('${integrationId}');\n  const __inner = ${handlerCode};\n  const __config = ${serializedConfig};\n  const __mapping = ${serializedMapping};\n  const __baseInput = (input && typeof input === 'object' && !Array.isArray(input)) ? input : {};\n  const __injected = {};\n  for (const [targetKey, configKey] of Object.entries(__mapping)) {\n    const value = __config?.[configKey];\n    if (value === undefined || value === null)\n      throw new Error(\`Missing integration config value '\${configKey}' required for tool input '\${targetKey}'.\`);\n    __injected[targetKey] = value;\n  }\n  return await __inner({ ...__baseInput, ...__injected });\n}`
}

export function buildToolsByIntegration(
  spaceId: string,
  integrations: IntegrationData[],
  proxy: IntegrationProxy,
  opts: BuildToolsOptions = {},
): Record<string, { read: ExecutableTool[], write: ExecutableTool[], admin: ExecutableTool[] }> {
  const { requireWriteConfirmation = false, integrationsRef, toolDefinitions, utils: injectUtils } = opts
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
    const readDb = dedupeToolDefinitionsByName(dbDefsForIntegration.filter(t => t.scope === 'read'))
    const writeDb = dedupeToolDefinitionsByName(dbDefsForIntegration.filter(t => t.scope === 'write'))
    const adminDb = dedupeToolDefinitionsByName(dbDefsForIntegration.filter(t => t.scope === 'admin'))
    const effectiveReadBuiltIn = filterBuiltInToolsForOverrides(readBuiltIn, readDb)
    const effectiveWriteBuiltIn = filterBuiltInToolsForOverrides(writeBuiltIn, writeDb)
    const effectiveAdminBuiltIn = filterBuiltInToolsForOverrides(adminBuiltIn, adminDb)

    const buildActions = (arr: any[], scope: Scope): ExecutableTool[] => arr.map((t) => {
      const rawSchema = typeof t.inputSchema === 'string' ? JSON.parse(t.inputSchema) : t.inputSchema
      const schemaObj = sanitizeJsonSchema(rawSchema)
      const toolName = makeIntegrationToolName(integ.type, t.name, integ.id)
      const description = `[${integ.label} | ${integ.type}] ${t.description}`
      const extractFileContent = createExtractFileContent(getIntegration, integ.id)

      const wrapper = buildHandlerWrapper(integ.id, t.handlerCode, integ.config, t.injectFromConfig)
      const utils = injectUtils ?? buildSandboxUtils(Array.isArray(t.utils) ? t.utils : undefined, { extractFileContent })
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
      const extractFileContent = createExtractFileContent(getIntegration, integ.id)
      const wrapper = `async (input) => {\n  const integration = getIntegration('${integ.id}');\n  const __inner = ${t.handlerCode};\n  return await __inner(input);\n}`
      const utils = injectUtils ?? buildSandboxUtils(Array.isArray(t.utils) ? t.utils : undefined, { extractFileContent })
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
      read: [...buildActions(effectiveReadBuiltIn, 'read'), ...buildActionsFromToolDefinitions(readDb, 'read')],
      write: [...buildActions(effectiveWriteBuiltIn, 'write'), ...buildActionsFromToolDefinitions(writeDb, 'write')],
      admin: [...buildActions(effectiveAdminBuiltIn, 'admin'), ...buildActionsFromToolDefinitions(adminDb, 'admin')],
    }
  }

  return toolsByIntegration
}
