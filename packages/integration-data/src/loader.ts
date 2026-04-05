import type {
  CredentialVariantConfig,
  CredentialVariantsFile,
  GeneratedIntegrationEntry,
  IntegrationCatalogItem,
  IntegrationCredentialConfig,
  Manifest,
  ToolData,
  ToolListItem,
  ToolsetMeta,
} from './types.js'
import { GENERATED_INTEGRATIONS } from './generated/registry.js'

function humanizeName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w.length ? `${w[0]!.toUpperCase()}${w.slice(1).toLowerCase()}` : w)
    .join(' ')
}

function getIntegration(type: string): GeneratedIntegrationEntry | null {
  return GENERATED_INTEGRATIONS[type] ?? null
}

function cloneManifest(manifest: Manifest): Manifest {
  return {
    ...manifest,
    variantConfig: manifest.variantConfig
      ? JSON.parse(JSON.stringify(manifest.variantConfig))
      : undefined,
    toolsets: manifest.toolsets ? { ...manifest.toolsets } : undefined,
    tools: manifest.tools.map(tool => ({
      ...tool,
      injectFromConfig: tool.injectFromConfig ? { ...tool.injectFromConfig } : undefined,
    })),
  }
}

function cloneCredentialVariant(variant: CredentialVariantConfig): CredentialVariantConfig {
  return {
    ...variant,
    injection: {
      headers: variant.injection?.headers ? { ...variant.injection.headers } : undefined,
      query: variant.injection?.query ? { ...variant.injection.query } : undefined,
    },
    healthCheck: 'path' in variant.healthCheck
      ? { ...variant.healthCheck }
      : { notViable: true },
  }
}

function validateCredentialVariant(type: string, variantKey: string, variant: CredentialVariantConfig): void {
  const healthCheck = variant.healthCheck
  const hasHealthCheckPath = 'path' in healthCheck && typeof healthCheck.path === 'string' && healthCheck.path.trim().length > 0
  const healthCheckNotViable = 'notViable' in healthCheck && healthCheck.notViable === true

  if (hasHealthCheckPath === healthCheckNotViable) {
    throw new Error(
      `Invalid credentials config for '${type}/${variantKey}': declare exactly one of 'healthCheck.path' or 'healthCheck.notViable: true'.`,
    )
  }
}

function validateCredentialVariantsFile(type: string, raw: CredentialVariantsFile): CredentialVariantsFile {
  if (!raw?.variants || typeof raw.variants !== 'object')
    throw new Error(`Invalid credentials config for '${type}': missing variants object.`)

  for (const [variantKey, variant] of Object.entries(raw.variants))
    validateCredentialVariant(type, variantKey, variant)

  return raw
}

function cloneCredentialVariantsFile(type: string, variants: CredentialVariantsFile): CredentialVariantsFile {
  const validated = validateCredentialVariantsFile(type, variants)

  return {
    default: validated.default,
    variants: Object.fromEntries(
      Object.entries(validated.variants).map(([key, value]) => [key, cloneCredentialVariant(value)]),
    ),
  }
}

function stripInjectedFieldsFromSchema(
  inputSchema: ToolData['inputSchema'],
  injectFromConfig?: Record<string, string>,
): ToolData['inputSchema'] {
  const injectedKeys = Object.keys(injectFromConfig ?? {})
  if (!injectedKeys.length || !inputSchema || typeof inputSchema !== 'object' || Array.isArray(inputSchema))
    return inputSchema

  const schema = JSON.parse(JSON.stringify(inputSchema)) as Record<string, unknown>
  const properties = schema.properties
  if (properties && typeof properties === 'object' && !Array.isArray(properties)) {
    for (const key of injectedKeys)
      delete (properties as Record<string, unknown>)[key]
  }

  if (Array.isArray(schema.required)) {
    const required = schema.required.filter(key => !injectedKeys.includes(String(key)))
    if (required.length)
      schema.required = required
    else
      delete schema.required
  }

  return schema
}

export function loadIntegrationManifest(type: string): Manifest | null {
  const entry = getIntegration(type)
  return entry ? cloneManifest(entry.manifest) : null
}

export function loadIntegrationPrompt(type: string): string | null {
  return getIntegration(type)?.prompt ?? null
}

export function loadIntegrationToolsets(type: string): Record<string, ToolsetMeta> | null {
  const toolsets = getIntegration(type)?.manifest.toolsets
  return toolsets ? { ...toolsets } : null
}

const SCOPE_RANK: Record<string, number> = { read: 0, write: 1, admin: 2 }

export function loadIntegrationTools(
  type: string,
  opts?: {
    credentialVariant?: string
    toolsets?: string[]
    maxScope?: 'read' | 'write' | null
    disabledTools?: string[] | null
  },
): { read: ToolData[], write: ToolData[], admin: ToolData[] } | null {
  const entry = getIntegration(type)
  if (!entry)
    return null

  const activeVariant = opts?.credentialVariant
  const activeToolsets = opts?.toolsets
  const maxRank = opts?.maxScope != null ? (SCOPE_RANK[opts.maxScope] ?? 2) : 2
  const blocked = opts?.disabledTools?.length ? new Set(opts.disabledTools) : null

  const read: ToolData[] = []
  const write: ToolData[] = []
  const admin: ToolData[] = []

  for (const tool of entry.tools) {
    if (activeVariant && tool.credentialVariants && !tool.credentialVariants.includes(activeVariant))
      continue
    if (activeToolsets && tool.toolset && !activeToolsets.includes(tool.toolset))
      continue

    const scope = tool.scope || 'read'
    if ((SCOPE_RANK[scope] ?? 0) > maxRank)
      continue
    if (blocked?.has(tool.name))
      continue

    const nextTool: ToolData = {
      name: tool.name,
      displayName: tool.displayName,
      description: tool.description,
      inputSchema: stripInjectedFieldsFromSchema(tool.inputSchema, tool.injectFromConfig),
      handlerCode: tool.handlerCode,
      utils: tool.utils,
      injectFromConfig: tool.injectFromConfig ? { ...tool.injectFromConfig } : undefined,
    }

    if (scope === 'write') write.push(nextTool)
    else if (scope === 'admin') admin.push(nextTool)
    else read.push(nextTool)
  }

  return { read, write, admin }
}

export function loadIntegrationToolList(
  type: string,
  opts?: {
    credentialVariant?: string
    toolsets?: string[]
    maxScope?: 'read' | 'write' | null
    disabledTools?: string[] | null
  },
): ToolListItem[] {
  const manifest = getIntegration(type)?.manifest
  if (!manifest)
    return []

  const activeVariant = opts?.credentialVariant
  const activeToolsets = opts?.toolsets
  const maxRank = opts?.maxScope != null ? (SCOPE_RANK[opts.maxScope] ?? 2) : 2
  const blocked = opts?.disabledTools?.length ? new Set(opts.disabledTools) : null

  return manifest.tools
    .filter((tool) => {
      if (activeVariant && tool.credentialVariants && !tool.credentialVariants.includes(activeVariant))
        return false
      if (activeToolsets && tool.toolset && !activeToolsets.includes(tool.toolset))
        return false
      const scope = tool.scope || 'read'
      if ((SCOPE_RANK[scope] ?? 0) > maxRank)
        return false
      if (blocked?.has(tool.name))
        return false
      return true
    })
    .map(tool => ({
      name: tool.name,
      displayName: humanizeName(tool.name),
      description: tool.description,
      scope: (tool.scope || 'read') as 'read' | 'write' | 'admin',
      toolset: tool.toolset,
    }))
}

export function loadIntegrationVariants(type: string): CredentialVariantsFile | null {
  const variants = getIntegration(type)?.variants
  return variants ? cloneCredentialVariantsFile(type, variants) : null
}

export function loadIntegrationCredentialConfig(
  type: string,
  variantKey?: string | null,
): IntegrationCredentialConfig | null {
  const ownerType = getIntegration(type)?.variantOwnerType ?? type
  const file = loadIntegrationVariants(ownerType)
  if (!file)
    return null

  const key = variantKey || file.default
  const variant = file.variants[key]
  if (!variant)
    return null

  return {
    variantKey: key,
    label: variant.label,
    schema: variant.schema,
    baseUrlTemplate: typeof variant.baseUrlTemplate === 'string' ? variant.baseUrlTemplate : undefined,
    injection: {
      headers: variant.injection?.headers || undefined,
      query: variant.injection?.query || undefined,
    },
    preprocess: variant.preprocess,
    healthCheck: cloneCredentialVariant(variant).healthCheck,
  }
}

export function loadIntegrationHint(type: string, variantKey?: string | null): string | null {
  const ownerType = getIntegration(type)?.variantOwnerType ?? type
  const entry = getIntegration(ownerType)
  if (!entry)
    return null

  if (variantKey && entry.hintsByVariant[variantKey])
    return entry.hintsByVariant[variantKey]!

  return entry.hint ?? null
}

export function listIntegrationTypes(): string[] {
  return Object.keys(GENERATED_INTEGRATIONS)
}

export function listIntegrationCatalog(): IntegrationCatalogItem[] {
  return listIntegrationTypes()
    .filter(type => !GENERATED_INTEGRATIONS[type]!.variantOwnerType)
    .map(type => ({
      type,
      name: GENERATED_INTEGRATIONS[type]!.manifest.name || type,
      variants: listIntegrationTypes()
        .filter(candidate => GENERATED_INTEGRATIONS[candidate]!.variantOwnerType === type)
        .map(candidate => ({
          type: candidate,
          label: GENERATED_INTEGRATIONS[candidate]!.manifest.variantLabel || candidate,
          variantConfig: GENERATED_INTEGRATIONS[candidate]!.manifest.variantConfig?.map(item => ({
            key: item.key,
            label: item.label,
            selectionMode: item.selectionMode,
            hasListHandler: Boolean(item.listHandler),
          })) ?? null,
        })),
    }))
}
