import type {
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
    toolsets: manifest.toolsets ? { ...manifest.toolsets } : undefined,
    tools: manifest.tools.map(tool => ({ ...tool })),
  }
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
      inputSchema: tool.inputSchema,
      handlerCode: tool.handlerCode,
      utils: tool.utils,
    }

    if (scope === 'write') write.push(nextTool)
    else if (scope === 'admin') admin.push(nextTool)
    else read.push(nextTool)
  }

  return { read, write, admin }
}

export function loadIntegrationToolList(type: string): ToolListItem[] {
  const manifest = getIntegration(type)?.manifest
  if (!manifest)
    return []

  return manifest.tools.map(tool => ({
    name: tool.name,
    displayName: humanizeName(tool.name),
    description: tool.description,
    scope: (tool.scope || 'read') as 'read' | 'write' | 'admin',
    toolset: tool.toolset,
  }))
}

export function loadIntegrationVariants(type: string): CredentialVariantsFile | null {
  const variants = getIntegration(type)?.variants
  return variants
    ? {
        default: variants.default,
        variants: Object.fromEntries(
          Object.entries(variants.variants).map(([key, value]) => [key, { ...value }]),
        ),
      }
    : null
}

export function loadIntegrationCredentialConfig(
  type: string,
  variantKey?: string | null,
): IntegrationCredentialConfig | null {
  const file = getIntegration(type)?.variants
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
    healthCheck: variant.healthCheck ?? undefined,
  }
}

export function loadIntegrationHint(type: string, variantKey?: string | null): string | null {
  const entry = getIntegration(type)
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
  return listIntegrationTypes().map(type => ({
    type,
    name: GENERATED_INTEGRATIONS[type]!.manifest.name || type,
  }))
}
