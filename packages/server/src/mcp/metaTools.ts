import type { AbilityCatalog } from './abilityCatalog.js'
import type { SessionAbilityState } from './sessionState.js'
import type { McpToolDefinition } from './toolAdapter.js'
import { buildMcpToolIndexForIntegrations } from './toolAdapter.js'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import crypto from 'node:crypto'
import { listIntegrationCatalog } from '../integrations/catalog.js'
import { loadIntegrationCredentialConfig, loadIntegrationManifest, loadIntegrationPrompt } from '../integrations/dataLoader.js'
import type { DbClient } from '../db/client.js'
import { listIntegrations, upsertIntegration } from '../db/integrationStore.js'
import type { SqlCredentialStore } from '../db/credentialStore.js'
import type { IntegrationData } from '../types.js'
import type { IntegrationProxy } from '../integrations/proxy.js'

export const META_TOOL_NAMES = {
  readme: 'commandable_readme',
  searchTools: 'commandable_search_tools',
  enableToolset: 'commandable_enable_toolset',
  disableToolset: 'commandable_disable_toolset',
  listIntegrations: 'commandable_list_integrations',
  addIntegration: 'commandable_add_integration',
} as const

export type MetaToolName = typeof META_TOOL_NAMES[keyof typeof META_TOOL_NAMES]

export type { McpToolDefinition } from './toolAdapter.js'

function buildCommandableReadme(): string {
  const path = fileURLToPath(new URL('./commandable_readme.md', import.meta.url))
  return readFileSync(path, 'utf8')
}

export type MetaToolContext = {
  spaceId: string
  db: DbClient
  credentialStore: SqlCredentialStore
  proxy: IntegrationProxy
  /**
   * Optional. If set, meta-tools can return URLs like:
   *   `${credentialSetupBaseUrl}/integrations/<integrationId>`
   */
  credentialSetupBaseUrl?: string
  /**
   * Mutable reference used by create mode. If supplied, meta-tools may update
   * it after adding integrations (e.g., push new record or reload from DB).
   */
  integrationsRef?: { current: IntegrationData[] }
  /**
   * Mutable reference to tool index + catalog. If supplied, meta-tools may
   * dynamically register new tools and rebuild the catalog.
   *
   * (Wired in during the \"dynamic tool loading\" step.)
   */
  toolIndexRef?: {
    byName: Map<string, any>
    list?: Array<{ name: string, description?: string, inputSchema: any }>
  }
  catalogRef?: { current: AbilityCatalog }
}

export function getMetaToolDefinitions(): McpToolDefinition[] {
  return [
    {
      name: META_TOOL_NAMES.readme,
      description: 'Read this first. Returns a guide explaining how Commandable works and how to discover/add integrations safely.',
      inputSchema: { type: 'object', additionalProperties: false, properties: {}, required: [] },
    },
    {
      name: META_TOOL_NAMES.searchTools,
      description: `Search available toolsets (integration/toolset bundles) you can enable in this session. Call \`${META_TOOL_NAMES.readme}\` first if you haven't yet.`,
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
      description: `Enable a toolset in the current session, making its tools available. Call \`${META_TOOL_NAMES.readme}\` first if you haven't yet.`,
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
      description: `Disable a toolset from the current session, removing its tools. Call \`${META_TOOL_NAMES.readme}\` first if you haven't yet.`,
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
      name: META_TOOL_NAMES.listIntegrations,
      description: `List available pre-built integrations you can add (from the integration catalog) and show which are already configured. Call \`${META_TOOL_NAMES.readme}\` first if you haven't yet.`,
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          query: { type: 'string' },
          limit: { type: 'number', minimum: 1, maximum: 100 },
        },
        required: [],
      },
    },
    {
      name: META_TOOL_NAMES.addIntegration,
      description: `Add a pre-built integration from the catalog to this Commandable instance (credentials are entered out-of-band). Call \`${META_TOOL_NAMES.readme}\` first if you haven't yet.`,
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          type: { type: 'string', minLength: 1 },
          label: { type: 'string' },
          credential_variant: { type: 'string' },
          max_scope: { type: 'string', enum: ['read', 'write'] },
          enabled_toolsets: { type: 'array', items: { type: 'string' } },
          disabled_tools: { type: 'array', items: { type: 'string' } },
        },
        required: ['type'],
      },
    },
  ]
}

export type MetaToolCallResult =
  | { handled: false }
  | { handled: true, listChanged: boolean, result: any }

export async function handleMetaToolCall(params: {
  name: string
  args: any
  sessionId: string | undefined
  catalog: AbilityCatalog
  sessionState: SessionAbilityState
  ctx?: MetaToolContext
}): Promise<MetaToolCallResult> {
  const { name, args, sessionId, catalog, sessionState, ctx } = params

  if (name === META_TOOL_NAMES.readme) {
    return { handled: true, listChanged: false, result: { markdown: buildCommandableReadme() } }
  }

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
    const integrationGuide = (() => {
      try { return loadIntegrationPrompt(ability.integrationtype) } catch { return null }
    })()
    return {
      handled: true,
      listChanged: newTools.length > 0,
      result: {
        loaded: true,
        toolset_id: ability.id,
        label: ability.label,
        tool_count: ability.toolNames.length,
        new_tools: newTools,
        integration_guide: integrationGuide,
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

  if (name === META_TOOL_NAMES.listIntegrations) {
    if (!ctx)
      throw new Error('Integration management is not available in this server mode.')

    const q = String(args?.query ?? '').trim().toLowerCase()
    const limitRaw = args?.limit
    const limit = typeof limitRaw === 'number' && Number.isFinite(limitRaw) ? Math.max(1, Math.min(100, limitRaw)) : 50

    const catalogItems = listIntegrationCatalog()
    const configured = await listIntegrations(ctx.db, ctx.spaceId)
    const byType = new Map<string, IntegrationData[]>()
    for (const it of configured) {
      const arr = byType.get(it.type) || []
      arr.push(it)
      byType.set(it.type, arr)
    }

    const items = []
    for (const it of catalogItems) {
      if (q) {
        const hay = `${it.type} ${it.name}`.toLowerCase()
        if (!hay.includes(q))
          continue
      }

      const instances = byType.get(it.type) || []
      const instanceInfos = await Promise.all(instances.map(async (inst) => {
        const hasCreds = inst.connectionMethod === 'credentials' && inst.credentialId
          ? await ctx.credentialStore.hasCredentials(ctx.spaceId, inst.credentialId)
          : false

        const baseUrl = ctx.credentialSetupBaseUrl ? ctx.credentialSetupBaseUrl.replace(/\/+$/, '') : null
        const credentialUrl = baseUrl && inst.connectionMethod === 'credentials'
          ? `${baseUrl}/integrations/${encodeURIComponent(inst.id)}`
          : null

        return {
          id: inst.id,
          label: inst.label,
          enabled: inst.enabled !== false,
          connection_method: inst.connectionMethod ?? null,
          credential_variant: inst.credentialVariant ?? null,
          has_credentials: hasCreds,
          health_status: inst.healthStatus ?? null,
          health_checked_at: inst.healthCheckedAt ? inst.healthCheckedAt.toISOString() : null,
          credential_url: credentialUrl,
        }
      }))

      items.push({
        type: it.type,
        name: it.name,
        configured: instances.length > 0,
        instances: instanceInfos,
        supports_credentials: !!loadIntegrationCredentialConfig(it.type, null),
      })
      if (items.length >= limit)
        break
    }

    return { handled: true, listChanged: false, result: { integrations: items } }
  }

  if (name === META_TOOL_NAMES.addIntegration) {
    if (!ctx)
      throw new Error('Integration management is not available in this server mode.')

    const type = String(args?.type || '').trim()
    if (!type)
      throw new Error('type is required')

    const catalogItems = listIntegrationCatalog()
    const exists = catalogItems.some(i => i.type === type)
    if (!exists)
      throw new Error(`Unknown integration type: ${type}`)

    const manifest = loadIntegrationManifest(type) as any
    const defaultLabel = (manifest && typeof manifest === 'object' && typeof manifest.name === 'string' && manifest.name.trim().length)
      ? manifest.name.trim()
      : type

    const id = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex')
    const shortId = id.replace(/[^a-z0-9]/gi, '').slice(0, 8).toLowerCase()
    const label = String(args?.label || '').trim() || defaultLabel

    const enabledToolsets = Array.isArray(args?.enabled_toolsets) ? args.enabled_toolsets.map((s: any) => String(s)).filter(Boolean) : undefined
    const disabledTools = Array.isArray(args?.disabled_tools) ? args.disabled_tools.map((s: any) => String(s)).filter(Boolean) : undefined
    const maxScope = args?.max_scope === 'read' || args?.max_scope === 'write' ? args.max_scope : undefined
    const credentialVariant = typeof args?.credential_variant === 'string' && args.credential_variant.trim().length
      ? args.credential_variant.trim()
      : null

    const referenceId = `${type}-${shortId}`
    const integration: IntegrationData = {
      spaceId: ctx.spaceId,
      id,
      type,
      referenceId,
      label,
      enabled: true,
      enabledToolsets: enabledToolsets?.length ? enabledToolsets : undefined,
      maxScope,
      disabledTools: disabledTools?.length ? disabledTools : undefined,
      credentialVariant,
      // mark as credentials-based immediately; values are entered out-of-band via management UI
      connectionMethod: 'credentials',
      credentialId: `${referenceId}-creds`,
    }

    await upsertIntegration(ctx.db, integration)

    // Refresh mutable integrations ref if present (keeps tool handlers from capturing stale config).
    if (ctx.integrationsRef) {
      try { ctx.integrationsRef.current = await listIntegrations(ctx.db, ctx.spaceId) } catch {}
    }

    const credCfg = loadIntegrationCredentialConfig(type, credentialVariant)
    const credentialFields = credCfg?.schema && typeof credCfg.schema === 'object'
      ? Object.keys((credCfg.schema as any).properties || {})
      : []

    const baseUrl = ctx.credentialSetupBaseUrl ? ctx.credentialSetupBaseUrl.replace(/\/+$/, '') : null
    const managementUrl = baseUrl ? `${baseUrl}/integrations` : null
    const credentialUrl = baseUrl ? `${baseUrl}/integrations/${encodeURIComponent(id)}` : null

    // Dynamic tool registration (create mode): materialize tools for this integration
    // and register them into the live tool index + ability catalog.
    let registeredTools = 0
    let registeredToolsets: Array<{ toolset_id: string, label: string, tool_count: number }> = []
    if (ctx.toolIndexRef && ctx.catalogRef) {
      const toolIndex = buildMcpToolIndexForIntegrations({
        spaceId: ctx.spaceId,
        integrations: [integration],
        proxy: ctx.proxy,
        integrationsRef: ctx.integrationsRef,
      })

      for (const [toolName, tool] of toolIndex.byName.entries()) {
        if (!ctx.toolIndexRef.byName.has(toolName)) {
          ctx.toolIndexRef.byName.set(toolName, tool)
          registeredTools++
        }
      }
      if (ctx.toolIndexRef.list) {
        for (const t of toolIndex.tools) {
          if (!ctx.toolIndexRef.list.find(x => x.name === t.name))
            ctx.toolIndexRef.list.push(t)
        }
      }

      const newAbilities = ctx.catalogRef.current.addIntegration(integration)
      registeredToolsets = newAbilities.map(a => ({
        toolset_id: a.id,
        label: a.label,
        tool_count: a.toolNames.length,
      }))
    }

    return {
      handled: true,
      listChanged: false,
      result: {
        added: true,
        integration: {
          id,
          type,
          label,
          reference_id: integration.referenceId,
          credential_variant: credentialVariant,
        },
        registered_tools: registeredTools,
        toolsets: registeredToolsets,
        credentials_needed: !!credCfg,
        management_url: managementUrl,
        credential_url: credentialUrl,
        credential_fields: credentialFields,
        next_steps: credentialUrl
          ? ['Open credential_url to enter credentials, then enable a toolset and use tools.']
          : ['Start the management UI (create mode) to get a credential URL, then enable a toolset and use tools.'],
      },
    }
  }

  return { handled: false }
}

