import type { AbilityCatalog } from './abilityCatalog.js'
import type { SessionAbilityState } from './sessionState.js'
import type { McpToolDefinition } from './toolAdapter.js'

export const META_TOOL_NAMES = {
  searchTools: 'commandable_search_tools',
  enableToolset: 'commandable_enable_toolset',
  disableToolset: 'commandable_disable_toolset',
} as const

export type MetaToolName = typeof META_TOOL_NAMES[keyof typeof META_TOOL_NAMES]

export type { McpToolDefinition } from './toolAdapter.js'

export function getMetaToolDefinitions(): McpToolDefinition[] {
  return [
    {
      name: META_TOOL_NAMES.searchTools,
      description: 'Search available toolsets (integration/toolset bundles) you can enable in this session.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          query: { type: 'string', minLength: 1 },
          limit: { type: 'number', minimum: 1, maximum: 50 },
        },
        required: ['query'],
      },
    },
    {
      name: META_TOOL_NAMES.enableToolset,
      description: 'Enable a toolset in the current session, making its tools available.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          toolset_id: { type: 'string', minLength: 1 },
        },
        required: ['toolset_id'],
      },
    },
    {
      name: META_TOOL_NAMES.disableToolset,
      description: 'Disable a toolset from the current session, removing its tools.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          toolset_id: { type: 'string', minLength: 1 },
        },
        required: ['toolset_id'],
      },
    },
  ]
}

export type MetaToolCallResult =
  | { handled: false }
  | { handled: true, listChanged: boolean, result: any }

export function handleMetaToolCall(params: {
  name: string
  args: any
  sessionId: string | undefined
  catalog: AbilityCatalog
  sessionState: SessionAbilityState
}): MetaToolCallResult {
  const { name, args, sessionId, catalog, sessionState } = params

  if (name === META_TOOL_NAMES.searchTools) {
    const query = String(args?.query || '').trim()
    const limitRaw = args?.limit
    const limit = typeof limitRaw === 'number' && Number.isFinite(limitRaw) ? Math.max(1, Math.min(50, limitRaw)) : 10
    if (!query)
      throw new Error('query is required')

    const res = catalog.search(query, limit).map(a => ({
      toolset_id: a.id,
      label: a.label,
      description: a.description,
      integration_type: a.integrationtype,
      integration_label: a.integrationLabel,
      toolset_key: a.toolsetKey || null,
      tool_count: a.toolCount,
      score: a.score,
    }))

    return { handled: true, listChanged: false, result: { toolsets: res } }
  }

  if (name === META_TOOL_NAMES.enableToolset) {
    const toolsetId = String(args?.toolset_id || '').trim()
    if (!toolsetId)
      throw new Error('toolset_id is required')
    const ability = catalog.getAbility(toolsetId)
    if (!ability)
      throw new Error(`Unknown toolset_id: ${toolsetId}`)

    const { newTools } = sessionState.loadAbility(sessionId, ability)
    return {
      handled: true,
      listChanged: newTools.length > 0,
      result: {
        loaded: true,
        toolset_id: ability.id,
        label: ability.label,
        tool_count: ability.toolNames.length,
        new_tools: newTools,
      },
    }
  }

  if (name === META_TOOL_NAMES.disableToolset) {
    const toolsetId = String(args?.toolset_id || '').trim()
    if (!toolsetId)
      throw new Error('toolset_id is required')
    const ability = catalog.getAbility(toolsetId)
    if (!ability)
      throw new Error(`Unknown toolset_id: ${toolsetId}`)

    const { removedTools } = sessionState.unloadAbility(sessionId, ability)
    return {
      handled: true,
      listChanged: removedTools.length > 0,
      result: {
        unloaded: true,
        toolset_id: ability.id,
        label: ability.label,
        removed_tools: removedTools,
      },
    }
  }

  return { handled: false }
}

