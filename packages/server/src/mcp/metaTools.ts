import type { AbilityCatalog } from './abilityCatalog.js'
import type { SessionAbilityState } from './sessionState.js'
import type { McpToolDefinition } from './toolAdapter.js'

export const META_TOOL_NAMES = {
  searchAbilities: 'commandable_search_abilities',
  loadAbility: 'commandable_load_ability',
  unloadAbility: 'commandable_unload_ability',
} as const

export type MetaToolName = typeof META_TOOL_NAMES[keyof typeof META_TOOL_NAMES]

export type { McpToolDefinition } from './toolAdapter.js'

export function getMetaToolDefinitions(): McpToolDefinition[] {
  return [
    {
      name: META_TOOL_NAMES.searchAbilities,
      description: 'Search available abilities (integration/toolset bundles) you can load in this session.',
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
      name: META_TOOL_NAMES.loadAbility,
      description: 'Load an ability into the current session, making its tools available.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          ability_id: { type: 'string', minLength: 1 },
        },
        required: ['ability_id'],
      },
    },
    {
      name: META_TOOL_NAMES.unloadAbility,
      description: 'Unload an ability from the current session, removing its tools.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          ability_id: { type: 'string', minLength: 1 },
        },
        required: ['ability_id'],
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

  if (name === META_TOOL_NAMES.searchAbilities) {
    const query = String(args?.query || '').trim()
    const limitRaw = args?.limit
    const limit = typeof limitRaw === 'number' && Number.isFinite(limitRaw) ? Math.max(1, Math.min(50, limitRaw)) : 10
    if (!query)
      throw new Error('query is required')

    const res = catalog.search(query, limit).map(a => ({
      ability_id: a.id,
      label: a.label,
      description: a.description,
      integration_type: a.integrationtype,
      integration_label: a.integrationLabel,
      toolset_key: a.toolsetKey || null,
      tool_count: a.toolCount,
      score: a.score,
    }))

    return { handled: true, listChanged: false, result: { abilities: res } }
  }

  if (name === META_TOOL_NAMES.loadAbility) {
    const abilityId = String(args?.ability_id || '').trim()
    if (!abilityId)
      throw new Error('ability_id is required')
    const ability = catalog.getAbility(abilityId)
    if (!ability)
      throw new Error(`Unknown ability_id: ${abilityId}`)

    const { newTools } = sessionState.loadAbility(sessionId, ability)
    return {
      handled: true,
      listChanged: newTools.length > 0,
      result: {
        loaded: true,
        ability_id: ability.id,
        label: ability.label,
        tool_count: ability.toolNames.length,
        new_tools: newTools,
      },
    }
  }

  if (name === META_TOOL_NAMES.unloadAbility) {
    const abilityId = String(args?.ability_id || '').trim()
    if (!abilityId)
      throw new Error('ability_id is required')
    const ability = catalog.getAbility(abilityId)
    if (!ability)
      throw new Error(`Unknown ability_id: ${abilityId}`)

    const { removedTools } = sessionState.unloadAbility(sessionId, ability)
    return {
      handled: true,
      listChanged: removedTools.length > 0,
      result: {
        unloaded: true,
        ability_id: ability.id,
        label: ability.label,
        removed_tools: removedTools,
      },
    }
  }

  return { handled: false }
}

