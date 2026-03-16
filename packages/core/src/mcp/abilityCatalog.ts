import { distance as levenshtein } from 'fastest-levenshtein'
import type { ExecutableTool, IntegrationData } from '../types.js'
import type { McpToolDefinition } from './toolAdapter.js'
import { loadIntegrationManifest } from '../integrations/dataLoader.js'
import { makeIntegrationToolName } from '../integrations/tools.js'

type Scope = 'read' | 'write' | 'admin'

type ManifestToolRef = {
  name: string
  description?: string
  scope?: Scope
  toolset?: string
  credentialVariants?: string[]
}

type ManifestToolsetMeta = {
  label?: string
  description?: string
}

type IntegrationManifest = {
  name?: string
  toolsets?: Record<string, ManifestToolsetMeta>
  tools?: ManifestToolRef[]
}

const SCOPE_RANK: Record<Scope, number> = { read: 0, write: 1, admin: 2 }

function shortNodeId(nodeId: string): string {
  return (nodeId || '').replace(/[^a-z0-9]/gi, '').slice(0, 8).toLowerCase()
}

function humanize(s: string): string {
  return (s || '')
    .replace(/_/g, ' ')
    .split(/\s+/g)
    .filter(Boolean)
    .map(w => (w.length ? `${w[0]!.toUpperCase()}${w.slice(1).toLowerCase()}` : w))
    .join(' ')
}

function sanitizeAbilityKey(s: string): string {
  return (s || '').toLowerCase().replace(/[^a-z0-9_]/g, '_')
}

export type AbilityId = string

export interface AbilityEntry {
  /** Unique ability id (includes integration instance suffix). */
  id: AbilityId
  integrationtype: string
  integrationLabel: string
  toolsetKey?: string
  label: string
  description: string
  toolNames: string[]
}

export interface AbilitySearchResult extends AbilityEntry {
  score: number
  toolCount: number
}

export type { McpToolDefinition } from './toolAdapter.js'

export const BUILDER_ABILITY_ID: AbilityId = 'commandable__builder'

const BUILDER_TOOL_NAMES = [
  'commandable_list_prebuilt_integrations',
  'commandable_add_prebuilt_integration',
  'commandable_upsert_custom_integration',
  'commandable_upsert_custom_tool',
  'commandable_delete_custom_tool',
  'commandable_delete_custom_integration',
  'commandable_test_custom_tool',
] as const

function makeAbilityId(integ: IntegrationData, toolsetKey?: string): AbilityId {
  const suffix = `__n${shortNodeId(integ.id)}`
  if (!toolsetKey)
    return `${sanitizeAbilityKey(integ.type)}${suffix}`
  return `${sanitizeAbilityKey(integ.type)}__${sanitizeAbilityKey(toolsetKey)}${suffix}`
}

function scoreQuery(query: string, haystack: string): number {
  const q = (query || '').toLowerCase().trim()
  if (!q)
    return 0

  const h = (haystack || '').toLowerCase()
  const qTokens = q.split(/\s+/g).filter(Boolean)

  let score = 0
  if (h === q)
    score += 15
  if (h.includes(q))
    score += 10
  if (h.startsWith(q))
    score += 12

  for (const t of qTokens) {
    if (h.startsWith(t))
      score += 6
    else if (h.includes(t))
      score += 4
  }

  const d = levenshtein(h.slice(0, 80), q.slice(0, 80))
  if (d <= 2)
    score += 5 - d

  return score
}

export class AbilityCatalog {
  private abilities: AbilityEntry[]
  private byId: Map<AbilityId, AbilityEntry>
  private toolIndex: Map<string, ExecutableTool>
  private extraToolDefinitions: Map<string, McpToolDefinition>
  private includeBuilderAbility: boolean

  constructor(params: {
    integrations: IntegrationData[]
    toolIndex: Map<string, ExecutableTool>
    extraToolDefinitions?: Map<string, McpToolDefinition>
    includeBuilderAbility?: boolean
  }) {
    this.toolIndex = params.toolIndex
    this.extraToolDefinitions = params.extraToolDefinitions || new Map()
    this.includeBuilderAbility = params.includeBuilderAbility ?? true
    this.abilities = [
      ...(this.includeBuilderAbility
        ? [{
            id: BUILDER_ABILITY_ID,
            integrationtype: 'commandable',
            integrationLabel: 'Commandable',
            toolsetKey: 'builder',
            label: 'Commandable Builder',
            description: 'Add integrations and vibe-code new tools (custom actions) against them.',
            toolNames: [...BUILDER_TOOL_NAMES],
          } satisfies AbilityEntry]
        : []),
      ...this.buildAbilities(params.integrations),
    ]
    this.byId = new Map(this.abilities.map(a => [a.id, a]))
  }

  allAbilities(): AbilityEntry[] {
    return this.abilities.slice()
  }

  getAbility(id: AbilityId): AbilityEntry | undefined {
    return this.byId.get(id)
  }

  getExecutableTool(name: string): ExecutableTool | undefined {
    return this.toolIndex.get(name)
  }

  /**
   * Dynamically add abilities for a newly added integration.
   * The integration's tools must already exist in this.toolIndex.
   */
  addIntegration(integration: IntegrationData): AbilityEntry[] {
    const added = this.buildAbilities([integration])
    if (!added.length)
      return []

    const newOnes: AbilityEntry[] = []
    for (const a of added) {
      if (this.byId.has(a.id))
        continue
      this.abilities.push(a)
      this.byId.set(a.id, a)
      newOnes.push(a)
    }
    return newOnes
  }

  addCustomTool(params: { integration: IntegrationData, toolName: string }): AbilityEntry {
    const abilityId = makeAbilityId(params.integration, 'custom')
    const existing = this.byId.get(abilityId)
    if (existing) {
      if (!existing.toolNames.includes(params.toolName))
        existing.toolNames.push(params.toolName)
      return existing
    }

    const created: AbilityEntry = {
      id: abilityId,
      integrationtype: params.integration.type,
      integrationLabel: params.integration.label,
      toolsetKey: 'custom',
      label: 'Custom Tools',
      description: `Agent-created tools for ${params.integration.label}`,
      toolNames: [params.toolName],
    }
    this.abilities.push(created)
    this.byId.set(created.id, created)
    return created
  }

  removeCustomTool(params: { integration: IntegrationData, toolName: string }): boolean {
    const abilityId = makeAbilityId(params.integration, 'custom')
    const existing = this.byId.get(abilityId)
    if (!existing)
      return false
    const before = existing.toolNames.length
    existing.toolNames = existing.toolNames.filter(name => name !== params.toolName)
    if (!existing.toolNames.length) {
      this.byId.delete(abilityId)
      this.abilities = this.abilities.filter(a => a.id !== abilityId)
    }
    return existing.toolNames.length !== before
  }

  removeIntegrationAbilities(integration: IntegrationData): number {
    const suffix = `__n${shortNodeId(integration.id)}`
    const removed = this.abilities.filter(a => a.id.endsWith(suffix)).map(a => a.id)
    if (!removed.length)
      return 0
    for (const id of removed)
      this.byId.delete(id)
    this.abilities = this.abilities.filter(a => !removed.includes(a.id))
    return removed.length
  }

  getToolDefinitions(toolNames: string[]): McpToolDefinition[] {
    const out: McpToolDefinition[] = []
    for (const n of toolNames) {
      const t = this.toolIndex.get(n)
      if (t) {
        out.push({ name: t.name, description: t.description, inputSchema: t.inputSchema })
        continue
      }
      const extra = this.extraToolDefinitions.get(n)
      if (extra)
        out.push(extra)
    }
    return out
  }

  search(query: string, limit: number = 10): AbilitySearchResult[] {
    const q = (query || '').trim()
    if (!q) {
      return this.abilities.slice(0, limit).map(a => ({
        ...a,
        score: 0,
        toolCount: a.toolNames.length,
      }))
    }

    const scored = this.abilities.map((a) => {
      const hay = [
        a.id,
        a.label,
        a.description,
        a.integrationLabel,
        a.integrationtype,
        a.toolsetKey || '',
      ].join(' ')

      return {
        ...a,
        toolCount: a.toolNames.length,
        score: scoreQuery(q, hay),
      }
    })

    scored.sort((a, b) => b.score - a.score)
    return scored.slice(0, limit)
  }

  private buildAbilities(integrations: IntegrationData[]): AbilityEntry[] {
    const out: AbilityEntry[] = []

    for (const integ of integrations) {
      const manifest = loadIntegrationManifest(integ.type) as IntegrationManifest | null
      const toolsets = manifest?.toolsets && Object.keys(manifest.toolsets).length ? manifest.toolsets : null

      const activeVariant = integ.credentialVariant ?? undefined
      const activeToolsets = integ.enabledToolsets ?? undefined
      const blocked = integ.disabledTools?.length ? new Set(integ.disabledTools) : null
      const maxRank = integ.maxScope != null ? (SCOPE_RANK[integ.maxScope] ?? 2) : 2

      const toolsByToolset = new Map<string, string[]>()
      const allTools: string[] = []

      if (manifest?.tools?.length) {
        for (const ref of manifest.tools) {
          if (!ref?.name)
            continue

          if (activeVariant && ref.credentialVariants?.length && !ref.credentialVariants.includes(activeVariant))
            continue
          if (activeToolsets && ref.toolset && !activeToolsets.includes(ref.toolset))
            continue

          const scope = (ref.scope || 'read') as Scope
          if ((SCOPE_RANK[scope] ?? 0) > maxRank)
            continue
          if (blocked?.has(ref.name))
            continue

          const toolName = makeIntegrationToolName(integ.type, ref.name, integ.id)
          // Only include tools that actually exist in the executable index.
          // (This should be true if filters match, but keeps us robust.)
          if (!this.toolIndex.has(toolName))
            continue

          allTools.push(toolName)

          const bucketKey = toolsets ? (ref.toolset || '__misc') : '__all'
          const arr = toolsByToolset.get(bucketKey) || []
          arr.push(toolName)
          toolsByToolset.set(bucketKey, arr)
        }
      }

      const suffix = `__n${shortNodeId(integ.id)}`
      const typePrefix = `${sanitizeAbilityKey(integ.type)}__`
      const allForIntegration = [...this.toolIndex.keys()].filter((n) => {
        if (!n.endsWith(suffix))
          return false
        if (!n.startsWith(typePrefix))
          return false
        return true
      })
      const builtInSet = new Set(allTools)
      const customTools = allForIntegration.filter(n => !builtInSet.has(n))

      if (!allTools.length && !customTools.length)
        continue

      // If no toolsets, the integration itself is the ability.
      if (!toolsets) {
        const label = manifest?.name || integ.type
        if (allTools.length) {
          out.push({
            id: makeAbilityId(integ),
            integrationtype: integ.type,
            integrationLabel: integ.label,
            label,
            description: `All ${label} tools`,
            toolNames: allTools,
          })
        }
        if (customTools.length) {
          out.push({
            id: makeAbilityId(integ, 'custom'),
            integrationtype: integ.type,
            integrationLabel: integ.label,
            toolsetKey: 'custom',
            label: 'Custom Tools',
            description: `Agent-created tools for ${integ.label}`,
            toolNames: customTools,
          })
        }
        continue
      }

      // Toolset-based abilities.
      for (const [toolsetKey, toolNames] of toolsByToolset.entries()) {
        if (!toolNames.length)
          continue

        const meta = toolsetKey !== '__misc' ? toolsets[toolsetKey] : undefined
        const label = meta?.label || (toolsetKey === '__misc' ? 'Other' : humanize(toolsetKey))
        const description = meta?.description || (toolsetKey === '__misc' ? `Other ${manifest?.name || integ.type} tools` : '')

        out.push({
          id: makeAbilityId(integ, toolsetKey === '__all' ? undefined : toolsetKey),
          integrationtype: integ.type,
          integrationLabel: integ.label,
          toolsetKey: toolsetKey === '__misc' ? undefined : toolsetKey,
          label,
          description,
          toolNames,
        })
      }

      if (customTools.length) {
        out.push({
          id: makeAbilityId(integ, 'custom'),
          integrationtype: integ.type,
          integrationLabel: integ.label,
          toolsetKey: 'custom',
          label: 'Custom Tools',
          description: `Agent-created tools for ${integ.label}`,
          toolNames: customTools,
        })
      }
    }

    return out
  }
}

