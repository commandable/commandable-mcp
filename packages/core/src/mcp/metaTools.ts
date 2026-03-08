import type { AbilityCatalog } from './abilityCatalog.js'
import { BUILDER_ABILITY_ID } from './abilityCatalog.js'
import type { SessionAbilityState } from './sessionState.js'
import type { McpToolDefinition } from './toolAdapter.js'
import { buildMcpToolIndexForIntegrations } from './toolAdapter.js'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import crypto from 'node:crypto'
import { listIntegrationCatalog } from '../integrations/catalog.js'
import { getBuiltInIntegrationTypeConfig } from '../integrations/fileIntegrationTypeConfigStore.js'
import { createGetIntegration } from '../integrations/getIntegration.js'
import { loadIntegrationManifest, loadIntegrationPrompt } from '../integrations/dataLoader.js'
import type { DbClient } from '../db/client.js'
import { deleteIntegrationById, listIntegrations, upsertIntegration } from '../db/integrationStore.js'
import type { SqlCredentialStore } from '../db/credentialStore.js'
import type { IntegrationCredentialVariant, IntegrationData } from '../types.js'
import type { IntegrationProxy } from '../integrations/proxy.js'
import { PROVIDERS } from '../integrations/providerRegistry.js'
import { createSafeHandlerFromString } from '../integrations/sandbox.js'
import { sanitizeJsonSchema } from '../integrations/tools.js'
import {
  deleteToolDefinitionByName,
  deleteToolDefinitionsForIntegration,
  getToolDefinitionByName,
  upsertToolDefinition,
} from '../db/toolDefinitionStore.js'
import { buildExecutableToolFromDefinition } from '../integrations/customToolFactory.js'
import { deleteIntegrationTypeConfig, getIntegrationTypeConfig, upsertIntegrationTypeConfig } from '../db/integrationTypeConfigStore.js'
import type { IntegrationTypeConfig } from '../types.js'

export const META_TOOL_NAMES = {
  readme: 'commandable_readme',
  searchTools: 'commandable_search_tools',
  enableToolset: 'commandable_enable_toolset',
  disableToolset: 'commandable_disable_toolset',
  listPrebuiltIntegrations: 'commandable_list_prebuilt_integrations',
  addPrebuiltIntegration: 'commandable_add_prebuilt_integration',
  upsertCustomIntegration: 'commandable_upsert_custom_integration',
  upsertCustomTool: 'commandable_upsert_custom_tool',
  deleteCustomIntegration: 'commandable_delete_custom_integration',
  deleteCustomTool: 'commandable_delete_custom_tool',
  testCustomTool: 'commandable_test_custom_tool',
} as const

export type MetaToolName = typeof META_TOOL_NAMES[keyof typeof META_TOOL_NAMES]

export type { McpToolDefinition } from './toolAdapter.js'

function normalizeHintMarkdown(value: string): string {
  return value
    .replace(/\r\n/g, '\n')
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
}

function buildCommandableReadme(): string {
  const path = fileURLToPath(new URL('./commandable_readme.md', import.meta.url))
  return readFileSync(path, 'utf8')
}

function buildBuilderGuide(): string {
  const path = fileURLToPath(new URL('./builder_guide.md', import.meta.url))
  return readFileSync(path, 'utf8')
}

function providerBaseUrl(integration: IntegrationData): string {
  const provider = PROVIDERS[integration.type]
  const base = provider?.baseUrl
  if (typeof base === 'function') {
    try { return String(base(integration, undefined) || '') } catch { return '(dynamic baseUrl)' }
  }
  return String(base || '')
}

function requireBuilderEnabled(sessionState: SessionAbilityState, sessionId: string | undefined, toolName: string) {
  if (!sessionState.isToolActive(sessionId, toolName)) {
    throw new Error(
      `Tool not enabled in this session: ${toolName}. Enable the builder toolset (${BUILDER_ABILITY_ID}) via commandable_search_tools → commandable_enable_toolset first.`,
    )
  }
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
  integrationTypeConfigsRef?: { current: IntegrationTypeConfig[] }
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
  ]
}

export function getBuilderToolDefinitions(): McpToolDefinition[] {
  return [
    {
      name: META_TOOL_NAMES.listPrebuiltIntegrations,
      description: `Builder tool. List available pre-built integrations you can add (from the integration catalog) and show which are already configured.`,
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
      name: META_TOOL_NAMES.addPrebuiltIntegration,
      description: `Builder tool. Add a pre-built integration from the catalog to this Commandable instance (credentials are entered out-of-band).`,
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
    {
      name: META_TOOL_NAMES.upsertCustomIntegration,
      description: 'Builder tool. Create or update a custom integration type (base URL + credential schema + auth injection rules). Omit type_slug to create a new one.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          type_slug: { type: 'string', minLength: 1 },
          label: { type: 'string', minLength: 1 },
          base_url: { type: 'string', minLength: 1 },
          auth_type: { type: 'string', enum: ['basic', 'custom'] },
          credential_fields: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                name: { type: 'string', minLength: 1 },
                label: { type: 'string', minLength: 1 },
                description: { type: 'string' },
                sensitive: { type: 'boolean' },
              },
              required: ['name', 'label'],
            },
          },
          credential_injection: {
            type: 'object',
            additionalProperties: false,
            properties: {
              headers: { type: 'object', additionalProperties: { type: 'string' } },
              query: { type: 'object', additionalProperties: { type: 'string' } },
            },
            required: [],
          },
          basic_username_field: { type: 'string' },
          basic_password_field: { type: 'string' },
          health_check_path: { type: 'string' },
          connection_hint: {
            type: 'string',
            description: 'Markdown shown in the credential form. Must be a numbered list of every step the user needs to follow to obtain the credentials — starting from navigating to the correct web page..',
          },
        },
        required: ['label', 'base_url', 'auth_type', 'credential_fields'],
      },
    },
    {
      name: META_TOOL_NAMES.testCustomTool,
      description: 'Builder tool. Run a sandboxed tool handler with a test input (does not persist). Use this to iterate before saving a tool.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          integration_id: { type: 'string', minLength: 1 },
          handler_code: { type: 'string', minLength: 1 },
          input_schema: { type: 'object' },
          test_input: { type: 'object' },
        },
        required: ['integration_id', 'handler_code'],
      },
    },
    {
      name: META_TOOL_NAMES.upsertCustomTool,
      description: 'Builder tool. Upsert a custom tool on an existing integration, and register it so it can be used immediately.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          integration_id: { type: 'string', minLength: 1 },
          name: { type: 'string', minLength: 1 },
          label: { type: 'string' },
          description: { type: 'string' },
          scope: { type: 'string', enum: ['read', 'write', 'admin'] },
          input_schema: { type: 'object' },
          handler_code: { type: 'string', minLength: 1 },
        },
        required: ['integration_id', 'name', 'handler_code'],
      },
    },
    {
      name: META_TOOL_NAMES.deleteCustomTool,
      description: 'Builder tool. Hard delete a custom tool from an integration by raw tool name (not the MCP materialized name).',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          integration_id: { type: 'string', minLength: 1 },
          name: { type: 'string', minLength: 1 },
        },
        required: ['integration_id', 'name'],
      },
    },
    {
      name: META_TOOL_NAMES.deleteCustomIntegration,
      description: 'Builder tool. Hard delete a custom integration instance, including its custom tools and linked credentials.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          integration_id: { type: 'string', minLength: 1 },
        },
        required: ['integration_id'],
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
      if (ability.id === BUILDER_ABILITY_ID) {
        const base = buildBuilderGuide()
        const integrations = ctx?.integrationsRef?.current || []
        const lines = integrations.map((i) => {
          const baseUrl = providerBaseUrl(i) || '(unknown baseUrl)'
          return `- \`${i.referenceId || i.id}\`: ${i.label} (${i.type}), baseUrl: ${baseUrl}`
        }).join('\n')
        return `${base}\n\n${lines ? `${lines}\n` : 'No integrations configured yet.\n'}`
      }
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

  if (name === META_TOOL_NAMES.listPrebuiltIntegrations) {
    requireBuilderEnabled(sessionState, sessionId, META_TOOL_NAMES.listPrebuiltIntegrations)
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
        supports_credentials: !!getBuiltInIntegrationTypeConfig(it.type),
      })
      if (items.length >= limit)
        break
    }

    return { handled: true, listChanged: false, result: { integrations: items } }
  }

  if (name === META_TOOL_NAMES.addPrebuiltIntegration) {
    requireBuilderEnabled(sessionState, sessionId, META_TOOL_NAMES.addPrebuiltIntegration)
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

    const parseStringArray = (v: any): string[] | undefined => {
      if (Array.isArray(v)) return v.map((s: any) => String(s)).filter(Boolean)
      if (typeof v === 'string') { try { const p = JSON.parse(v); return Array.isArray(p) ? p.map((s: any) => String(s)).filter(Boolean) : undefined } catch { return undefined } }
      return undefined
    }
    const enabledToolsets = parseStringArray(args?.enabled_toolsets)
    const disabledTools = parseStringArray(args?.disabled_tools)
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

    const typeConfig = getBuiltInIntegrationTypeConfig(type)
    const selectedVariantKey = credentialVariant || typeConfig?.defaultVariant || null
    const selectedVariant = selectedVariantKey ? typeConfig?.variants[selectedVariantKey] : null
    const credentialFields = selectedVariant?.credentialSchema && typeof selectedVariant.credentialSchema === 'object'
      ? Object.keys((selectedVariant.credentialSchema as any).properties || {})
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
        credentials_needed: !!typeConfig,
        management_url: managementUrl,
        credential_url: credentialUrl,
        credential_fields: credentialFields,
        next_steps: credentialUrl
          ? ['Open credential_url to enter credentials, then enable a toolset and use tools.']
          : ['Start the management UI (create mode) to get a credential URL, then enable a toolset and use tools.'],
      },
    }
  }

  if (name === META_TOOL_NAMES.upsertCustomIntegration) {
    requireBuilderEnabled(sessionState, sessionId, META_TOOL_NAMES.upsertCustomIntegration)
    if (!ctx)
      throw new Error('Integration management is not available in this server mode.')

    if (!ctx.integrationsRef)
      throw new Error('integrationsRef is required for builder mode.')
    if (!ctx.integrationTypeConfigsRef)
      throw new Error('integrationTypeConfigsRef is required for custom integrations.')

    const typeSlugInput = typeof args?.type_slug === 'string' ? args.type_slug.trim() : ''
    const label = String(args?.label || '').trim()
    const baseUrl = String(args?.base_url || '').trim()
    const authType = (args?.auth_type === 'basic' || args?.auth_type === 'custom') ? String(args.auth_type) : null
    const rawCredFields = args?.credential_fields
    const credentialFields = Array.isArray(rawCredFields)
      ? rawCredFields
      : (typeof rawCredFields === 'string' ? (() => { try { const p = JSON.parse(rawCredFields); return Array.isArray(p) ? p : [] } catch { return [] } })() : [])
    const rawCredInjection = args?.credential_injection
    const credentialInjection = rawCredInjection && typeof rawCredInjection === 'object' && !Array.isArray(rawCredInjection)
      ? rawCredInjection
      : (typeof rawCredInjection === 'string' ? (() => { try { const p = JSON.parse(rawCredInjection); return (p && typeof p === 'object' && !Array.isArray(p)) ? p : null } catch { return null } })() : null)
    const basicUsernameField = typeof args?.basic_username_field === 'string' ? args.basic_username_field.trim() : ''
    const basicPasswordField = typeof args?.basic_password_field === 'string' ? args.basic_password_field.trim() : ''
    const healthCheckPath = typeof args?.health_check_path === 'string' ? args.health_check_path.trim() : ''
    const connectionHint = typeof args?.connection_hint === 'string' ? normalizeHintMarkdown(args.connection_hint).trim() : ''

    if (!label)
      throw new Error('label is required')
    if (!baseUrl)
      throw new Error('base_url is required')
    if (!authType)
      throw new Error('auth_type must be basic or custom')
    if (!credentialFields.length)
      throw new Error('credential_fields is required')

    if (authType === 'custom') {
      const hasAny = credentialInjection && (credentialInjection.headers || credentialInjection.query)
      if (!hasAny)
        throw new Error('credential_injection is required when auth_type is custom')
    }
    else {
      if (!basicUsernameField || !basicPasswordField)
        throw new Error('basic_username_field and basic_password_field are required when auth_type is basic')
    }

    const toKebab = (s: string) => (s || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 32) || 'integration'
    const suffix = () => crypto.randomBytes(2).toString('hex')

    const existingSlugs = new Set(ctx.integrationTypeConfigsRef.current
      .filter(c => c.spaceId === ctx.spaceId)
      .map(c => c.typeSlug))
    let typeSlug = typeSlugInput
    if (!typeSlug) {
      for (let i = 0; i < 20; i++) {
        const candidate = `${toKebab(label)}-${suffix()}`
        if (!existingSlugs.has(candidate)) {
          typeSlug = candidate
          break
        }
      }
      if (!typeSlug)
        throw new Error('Failed to generate a unique type slug')
    }

    const existingCfg = typeSlugInput
      ? await getIntegrationTypeConfig(ctx.db, ctx.spaceId, typeSlugInput)
      : null
    if (typeSlugInput && !existingCfg)
      throw new Error(`Unknown type_slug: ${typeSlugInput}`)

    const schemaProps: Record<string, any> = {}
    const required: string[] = []
    for (const f of credentialFields) {
      const name = String(f?.name || '').trim()
      const title = String(f?.label || '').trim()
      if (!name || !title)
        continue
      const description = typeof f?.description === 'string' ? f.description : undefined
      const sensitive = !!f?.sensitive
      schemaProps[name] = {
        type: 'string',
        title,
        ...(description ? { description } : {}),
        ...(sensitive ? { format: 'password' } : {}),
      }
      required.push(name)
    }
    if (!Object.keys(schemaProps).length)
      throw new Error('credential_fields must include at least one valid field')

    const credentialSchema = sanitizeJsonSchema({
      type: 'object',
      properties: schemaProps,
      required,
      additionalProperties: false,
    })

    const id = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex')
    const cfgId = existingCfg?.id || (crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'))

    const defaultVariantConfig: IntegrationCredentialVariant = {
      label,
      credentialSchema,
      auth: authType === 'basic'
        ? { kind: 'basic', usernameField: basicUsernameField, passwordField: basicPasswordField }
        : { kind: 'template', injection: credentialInjection || {} },
      baseUrl,
      healthCheck: healthCheckPath ? { path: healthCheckPath } : null,
      hintMarkdown: connectionHint || null,
    }

    const customCfg: IntegrationTypeConfig = {
      id: cfgId,
      spaceId: ctx.spaceId,
      typeSlug,
      label,
      defaultVariant: 'default',
      variants: { default: defaultVariantConfig },
    }

    await upsertIntegrationTypeConfig(ctx.db, customCfg as any)

    const cfgIndex = ctx.integrationTypeConfigsRef.current.findIndex(c => c.spaceId === ctx.spaceId && c.typeSlug === typeSlug)
    if (cfgIndex >= 0)
      ctx.integrationTypeConfigsRef.current[cfgIndex] = customCfg
    else
      ctx.integrationTypeConfigsRef.current.push(customCfg)

    const existingIntegration = ctx.integrationsRef.current.find(i => i.type === typeSlug)
    const created = !existingIntegration
    const shortId = id.replace(/[^a-z0-9]/gi, '').slice(0, 8).toLowerCase()
    const referenceId = existingIntegration?.referenceId || `${typeSlug}-${shortId}`
    const integration: IntegrationData = existingIntegration
      ? {
          ...existingIntegration,
          spaceId: ctx.spaceId,
          type: typeSlug,
          label,
        }
      : {
          spaceId: ctx.spaceId,
          id,
          type: typeSlug,
          referenceId,
          label,
          enabled: true,
          connectionMethod: 'credentials',
          credentialId: `${referenceId}-creds`,
        }

    await upsertIntegration(ctx.db, integration)
    try { ctx.integrationsRef.current = await listIntegrations(ctx.db, ctx.spaceId) } catch {}

    const base = ctx.credentialSetupBaseUrl ? ctx.credentialSetupBaseUrl.replace(/\/+$/, '') : null
    const managementUrl = base ? `${base}/integrations` : null
    const credentialUrl = base ? `${base}/integrations/${encodeURIComponent(integration.id)}` : null

    return {
      handled: true,
      listChanged: false,
      result: {
        integration: {
          id: integration.id,
          type: typeSlug,
          label,
          reference_id: integration.referenceId,
          auth_type: authType,
        },
        upserted: true,
        created,
        management_url: managementUrl,
        credential_url: credentialUrl,
        next_steps: credentialUrl
          ? ['Open credential_url to enter credentials, then create tools with commandable_upsert_custom_tool.']
          : ['Start the management UI (create mode) to get a credential URL, then create tools with commandable_upsert_custom_tool.'],
      },
    }
  }

  if (name === META_TOOL_NAMES.testCustomTool) {
    requireBuilderEnabled(sessionState, sessionId, META_TOOL_NAMES.testCustomTool)
    if (!ctx)
      throw new Error('Tool building is not available in this server mode.')

    const integrationId = String(args?.integration_id || '').trim()
    const handlerCode = String(args?.handler_code || '').trim()
    const inputSchemaRaw = args?.input_schema
    const testInput = (args?.test_input && typeof args.test_input === 'object') ? args.test_input : {}

    if (!integrationId)
      throw new Error('integration_id is required')
    if (!handlerCode)
      throw new Error('handler_code is required')

    const integration = ctx.integrationsRef?.current?.find(i => i.id === integrationId || i.referenceId === integrationId)
    if (!integration)
      throw new Error(`Unknown integration_id: ${integrationId}`)

    const getIntegration = createGetIntegration(ctx.integrationsRef, ctx.proxy)
    const wrapper = `async (input) => {\n  const integration = getIntegration('${integration.id}');\n  const __inner = ${handlerCode};\n  return await __inner(input);\n}`
    const safe = createSafeHandlerFromString(wrapper, getIntegration)
    const res = await safe(testInput)
    return { handled: true, listChanged: false, result: res }
  }

  if (name === META_TOOL_NAMES.upsertCustomTool) {
    requireBuilderEnabled(sessionState, sessionId, META_TOOL_NAMES.upsertCustomTool)
    if (!ctx)
      throw new Error('Tool building is not available in this server mode.')

    const integrationId = String(args?.integration_id || '').trim()
    const toolNameRaw = String(args?.name || '').trim()
    const label = typeof args?.label === 'string' ? args.label.trim() : ''
    const description = typeof args?.description === 'string' ? args.description.trim() : ''
    const handlerCode = String(args?.handler_code || '').trim()
    const scope = (args?.scope === 'read' || args?.scope === 'write' || args?.scope === 'admin') ? args.scope : 'write'
    const inputSchemaObj = (args?.input_schema && typeof args.input_schema === 'object') ? args.input_schema : {
      type: 'object',
      additionalProperties: true,
    }

    if (!integrationId)
      throw new Error('integration_id is required')
    if (!toolNameRaw)
      throw new Error('name is required')
    if (!handlerCode)
      throw new Error('handler_code is required')
    if (!/^async\s*\(\s*input\s*\)\s*=>/.test(handlerCode))
      throw new Error('handler_code must start with: async (input) => { ... }')

    const integration = ctx.integrationsRef?.current?.find(i => i.id === integrationId || i.referenceId === integrationId)
    if (!integration)
      throw new Error(`Unknown integration_id: ${integrationId}`)

    const existing = await getToolDefinitionByName(ctx.db, ctx.spaceId, integration.id, toolNameRaw)
    const created = !existing
    const id = existing?.id || (crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'))

    const inputSchema = sanitizeJsonSchema(inputSchemaObj)

    await upsertToolDefinition(ctx.db, {
      id,
      spaceId: ctx.spaceId,
      integrationId: integration.id,
      name: toolNameRaw,
      displayName: label || null,
      description: description || toolNameRaw,
      inputSchema,
      handlerCode,
      scope,
    } as any)

    // Materialize executable tool and register into the live index.
    const executable = buildExecutableToolFromDefinition({
      spaceId: ctx.spaceId,
      integration,
      tool: {
        id,
        spaceId: ctx.spaceId,
        integrationId: integration.id,
        name: toolNameRaw,
        displayName: label || null,
        description: description || toolNameRaw,
        inputSchema,
        handlerCode,
        scope,
      } as any,
      proxy: ctx.proxy,
      integrationsRef: ctx.integrationsRef,
    })

    if (ctx.toolIndexRef) {
      ctx.toolIndexRef.byName.set(executable.name, executable)
      if (ctx.toolIndexRef.list && !ctx.toolIndexRef.list.find(t => t.name === executable.name)) {
        ctx.toolIndexRef.list.push({
          name: executable.name,
          description: executable.description,
          inputSchema: executable.inputSchema,
        })
      }
    }

    let customAbilityId: string | null = null
    if (ctx.catalogRef) {
      const ability = ctx.catalogRef.current.addCustomTool({ integration, toolName: executable.name })
      customAbilityId = ability.id
      // Auto-load the custom tools ability so the newly created tool is immediately callable.
      if (sessionId)
        sessionState.loadAbility(sessionId, ability)
    }

    return {
      handled: true,
      listChanged: true,
      result: {
        upserted: true,
        created,
        tool: {
          id,
          name: executable.name,
          display_name: executable.displayName,
          scope,
        },
        custom_toolset_id: customAbilityId,
        next_steps: [
          'Call the newly registered tool by name (it is now enabled in this session).',
        ],
      },
    }
  }

  if (name === META_TOOL_NAMES.deleteCustomTool) {
    requireBuilderEnabled(sessionState, sessionId, META_TOOL_NAMES.deleteCustomTool)
    if (!ctx)
      throw new Error('Tool building is not available in this server mode.')

    const integrationId = String(args?.integration_id || '').trim()
    const toolNameRaw = String(args?.name || '').trim()
    if (!integrationId)
      throw new Error('integration_id is required')
    if (!toolNameRaw)
      throw new Error('name is required')

    const integration = ctx.integrationsRef?.current?.find(i => i.id === integrationId || i.referenceId === integrationId)
    if (!integration)
      throw new Error(`Unknown integration_id: ${integrationId}`)

    const existing = await getToolDefinitionByName(ctx.db, ctx.spaceId, integration.id, toolNameRaw)
    if (!existing) {
      return {
        handled: true,
        listChanged: false,
        result: { deleted: false, reason: 'not_found' },
      }
    }

    const executable = buildExecutableToolFromDefinition({
      spaceId: ctx.spaceId,
      integration,
      tool: existing,
      proxy: ctx.proxy,
      integrationsRef: ctx.integrationsRef,
    })

    await deleteToolDefinitionByName(ctx.db, ctx.spaceId, integration.id, toolNameRaw)

    if (ctx.toolIndexRef) {
      ctx.toolIndexRef.byName.delete(executable.name)
      if (ctx.toolIndexRef.list)
        ctx.toolIndexRef.list = ctx.toolIndexRef.list.filter(t => t.name !== executable.name)
    }
    if (ctx.catalogRef)
      ctx.catalogRef.current.removeCustomTool({ integration, toolName: executable.name })
    sessionState.removeToolFromAllSessions(executable.name)

    return {
      handled: true,
      listChanged: true,
      result: {
        deleted: true,
        tool: {
          raw_name: toolNameRaw,
          name: executable.name,
        },
      },
    }
  }

  if (name === META_TOOL_NAMES.deleteCustomIntegration) {
    requireBuilderEnabled(sessionState, sessionId, META_TOOL_NAMES.deleteCustomIntegration)
    if (!ctx)
      throw new Error('Integration management is not available in this server mode.')
    if (!ctx.integrationsRef)
      throw new Error('integrationsRef is required for builder mode.')
    if (!ctx.integrationTypeConfigsRef)
      throw new Error('integrationTypeConfigsRef is required for custom integrations.')

    const integrationId = String(args?.integration_id || '').trim()
    if (!integrationId)
      throw new Error('integration_id is required')

    const integration = ctx.integrationsRef.current.find(i => i.id === integrationId || i.referenceId === integrationId)
    if (!integration)
      throw new Error(`Unknown integration_id: ${integrationId}`)

    const materializedToolNames = [...ctx.toolIndexRef?.byName.keys() || []]
      .filter(toolName => toolName.endsWith(`__n${integration.id.replace(/[^a-z0-9]/gi, '').slice(0, 8).toLowerCase()}`))
    for (const toolName of materializedToolNames) {
      ctx.toolIndexRef?.byName.delete(toolName)
      sessionState.removeToolFromAllSessions(toolName)
    }
    if (ctx.toolIndexRef?.list)
      ctx.toolIndexRef.list = ctx.toolIndexRef.list.filter(t => !materializedToolNames.includes(t.name))

    await deleteToolDefinitionsForIntegration(ctx.db, ctx.spaceId, integration.id)
    if (integration.connectionMethod === 'credentials' && integration.credentialId)
      await ctx.credentialStore.deleteCredentials(ctx.spaceId, integration.credentialId)
    await deleteIntegrationById(ctx.db, integration.id)

    const remainingIntegrations = await listIntegrations(ctx.db, ctx.spaceId)
    ctx.integrationsRef.current = remainingIntegrations
    if (!remainingIntegrations.some(i => i.type === integration.type)) {
      await deleteIntegrationTypeConfig(ctx.db, ctx.spaceId, integration.type)
      ctx.integrationTypeConfigsRef.current = ctx.integrationTypeConfigsRef.current
        .filter(cfg => !(cfg.spaceId === ctx.spaceId && cfg.typeSlug === integration.type))
    }
    if (ctx.catalogRef)
      ctx.catalogRef.current.removeIntegrationAbilities(integration)

    return {
      handled: true,
      listChanged: materializedToolNames.length > 0,
      result: {
        deleted: true,
        integration: {
          id: integration.id,
          type: integration.type,
          label: integration.label,
        },
      },
    }
  }

  return { handled: false }
}

