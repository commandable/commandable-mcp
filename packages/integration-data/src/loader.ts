import type { JSONSchema7 } from 'json-schema'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export interface CredentialVariantConfig {
  label: string
  schema: JSONSchema7
  /**
   * Optional template used to construct the provider base URL from credential fields.
   * Example: "https://{{domain}}.atlassian.net"
   */
  baseUrlTemplate?: string
  injection: {
    headers?: Record<string, string>
    query?: Record<string, string>
  }
  preprocess?: string
}

export interface CredentialVariantsFile {
  variants: Record<string, CredentialVariantConfig>
  default: string
}

/** Resolved config for a single credential variant -- what the proxy actually uses. */
export interface IntegrationCredentialConfig {
  variantKey: string
  label: string
  schema: JSONSchema7
  baseUrlTemplate?: string
  injection: {
    headers?: Record<string, string>
    query?: Record<string, string>
  }
  preprocess?: string
}

interface ToolRef {
  name: string
  description: string
  inputSchema: string
  handler: string
  scope?: 'read' | 'write' | 'admin'
  credentialVariants?: string[]
  toolset?: string
}

type FlatTools = ToolRef[]

interface DisplayCardRef {
  name: string
  description: string
  inputSchema: string
  component: string
}

export interface ToolsetMeta {
  label: string
  description: string
}

export interface ToolListItem {
  name: string
  description: string
  scope: 'read' | 'write' | 'admin'
  toolset?: string
}

export interface DisplayCardData {
  name: string
  description: string
  inputSchema: JSONSchema7
  component: string
}

export interface ToolData {
  name: string
  displayName?: string
  description: string
  inputSchema: JSONSchema7 | Record<string, unknown>
  handlerCode: string
  /** Optional sandbox util bundles required by this integration (e.g. ['adf']). */
  utils?: string[]
}

interface Manifest {
  name: string
  version?: string
  baseUrl?: string
  utils?: string[]
  toolsets?: Record<string, ToolsetMeta>
  tools: FlatTools
  displayCards?: DisplayCardRef[]
}

/**
 * Returns the root directory of the bundled integration-data files.
 * Can be overridden via COMMANDABLE_INTEGRATION_DATA_DIR for testing or
 * custom deployments.
 *
 * Resolution: dist/loader.js -> ../integrations/ (i.e. packages/integration-data/integrations/)
 * When installed as an npm package: node_modules/@commandable/integration-data/dist/loader.js
 * -> node_modules/@commandable/integration-data/integrations/
 */
export function integrationDataRoot(): string {
  if (process.env.COMMANDABLE_INTEGRATION_DATA_DIR)
    return resolve(process.env.COMMANDABLE_INTEGRATION_DATA_DIR)

  return resolve(fileURLToPath(new URL('../integrations/', import.meta.url)))
}

function integrationDir(type: string): string {
  return resolve(integrationDataRoot(), type)
}

function readJsonFile(path: string): any {
  const content = readFileSync(path, 'utf8')
  return JSON.parse(content)
}

function ensureSchemaObject(schema: any): any {
  if (!schema)
    return {}
  if (typeof schema === 'string') {
    try { return JSON.parse(schema) }
    catch { return {} }
  }
  return schema
}

export function loadIntegrationManifest(type: string): Manifest | null {
  const dir = integrationDir(type)
  const manifestPath = resolve(dir, 'manifest.json')
  if (!existsSync(manifestPath))
    return null
  return readJsonFile(manifestPath)
}

export function loadIntegrationPrompt(type: string): string | null {
  const dir = integrationDir(type)
  const promptPath = resolve(dir, 'prompt.md')
  if (!existsSync(promptPath))
    return null
  try {
    return readFileSync(promptPath, 'utf8')
  }
  catch {
    return null
  }
}

function materializeTool(type: string, ref: ToolRef, utils?: string[]): ToolData {
  const dir = integrationDir(type)
  const schemaPath = resolve(dir, ref.inputSchema)
  const handlerPath = resolve(dir, ref.handler)

  const schema = readJsonFile(schemaPath)
  const handlerCode = readFileSync(handlerPath, 'utf8').trim()

  return {
    name: ref.name,
    description: ref.description,
    inputSchema: ensureSchemaObject(schema),
    handlerCode,
    utils: Array.isArray(utils) ? utils : undefined,
  }
}

export function loadIntegrationDisplayCards(type: string): DisplayCardData[] {
  const manifest = loadIntegrationManifest(type)
  if (!manifest?.displayCards?.length)
    return []
  const dir = integrationDir(type)
  return manifest.displayCards.map((ref) => {
    const schemaPath = resolve(dir, ref.inputSchema)
    const schema = existsSync(schemaPath) ? ensureSchemaObject(readJsonFile(schemaPath)) : {}
    return {
      name: ref.name,
      description: ref.description,
      inputSchema: schema as JSONSchema7,
      component: ref.component,
    }
  })
}

export function loadIntegrationToolsets(type: string): Record<string, ToolsetMeta> | null {
  const manifest = loadIntegrationManifest(type)
  return manifest?.toolsets ?? null
}

const SCOPE_RANK: Record<string, number> = { read: 0, write: 1, admin: 2 }

/**
 * Load tools for an integration, optionally filtered to only those compatible
 * with the active credential variant. Tools without a `credentialVariants`
 * whitelist are always included.
 */
export function loadIntegrationTools(
  type: string,
  opts?: {
    credentialVariant?: string
    toolsets?: string[]
    /** Cap the maximum scope tier. 'read' means only read tools; 'write' means read+write. null/undefined means all. */
    maxScope?: 'read' | 'write' | null
    /** Individual tool names to block regardless of toolset or scope settings. */
    disabledTools?: string[] | null
  },
): { read: ToolData[], write: ToolData[], admin: ToolData[] } | null {
  const manifest = loadIntegrationManifest(type)
  if (!manifest)
    return null

  const activeVariant = opts?.credentialVariant
  const activeToolsets = opts?.toolsets
  const maxRank = opts?.maxScope != null ? (SCOPE_RANK[opts.maxScope] ?? 2) : 2
  const blocked = opts?.disabledTools?.length ? new Set(opts.disabledTools) : null

  const flat = manifest.tools as FlatTools
  const readRefs: ToolRef[] = []
  const writeRefs: ToolRef[] = []
  const adminRefs: ToolRef[] = []

  for (const t of flat) {
    if (activeVariant && t.credentialVariants && !t.credentialVariants.includes(activeVariant))
      continue
    if (activeToolsets && t.toolset && !activeToolsets.includes(t.toolset))
      continue

    const scope = t.scope || 'read'
    if ((SCOPE_RANK[scope] ?? 0) > maxRank)
      continue
    if (blocked?.has(t.name))
      continue

    if (scope === 'read') readRefs.push(t)
    else if (scope === 'write') writeRefs.push(t)
    else if (scope === 'admin') adminRefs.push(t)
    else readRefs.push(t)
  }

  return {
    read: readRefs.map(t => materializeTool(type, t, manifest.utils)),
    write: writeRefs.map(t => materializeTool(type, t, manifest.utils)),
    admin: adminRefs.map(t => materializeTool(type, t, manifest.utils)),
  }
}

/**
 * Returns a lightweight flat list of all tools in an integration's manifest
 * without materializing handlers or schemas. Used by the UI to render tool
 * selection controls.
 */
export function loadIntegrationToolList(type: string): ToolListItem[] {
  const manifest = loadIntegrationManifest(type)
  if (!manifest)
    return []
  return manifest.tools.map(t => ({
    name: t.name,
    description: t.description,
    scope: (t.scope || 'read') as 'read' | 'write' | 'admin',
    toolset: t.toolset,
  }))
}

/** Load the full variants file for an integration. */
export function loadIntegrationVariants(type: string): CredentialVariantsFile | null {
  const dir = integrationDir(type)
  const path = resolve(dir, 'credentials.json')
  if (!existsSync(path))
    return null

  try {
    const raw = readJsonFile(path)
    if (!raw?.variants)
      return null
    return raw as CredentialVariantsFile
  }
  catch {
    return null
  }
}

/**
 * Load the resolved credential config for a specific variant (or the default
 * variant if none is specified).
 */
export function loadIntegrationCredentialConfig(
  type: string,
  variantKey?: string | null,
): IntegrationCredentialConfig | null {
  const file = loadIntegrationVariants(type)
  if (!file)
    return null

  const key = variantKey || file.default
  const variant = file.variants[key]
  if (!variant)
    return null

  return {
    variantKey: key,
    label: variant.label,
    schema: ensureSchemaObject(variant.schema) as JSONSchema7,
    baseUrlTemplate: typeof (variant as any).baseUrlTemplate === 'string' ? (variant as any).baseUrlTemplate : undefined,
    injection: {
      headers: variant.injection?.headers || undefined,
      query: variant.injection?.query || undefined,
    },
    preprocess: variant.preprocess,
  }
}

/**
 * Resolve the hint markdown for a specific variant. Falls back to the
 * generic credentials_hint.md if no variant-specific file exists.
 */
export function loadIntegrationHint(type: string, variantKey?: string | null): string | null {
  const dir = integrationDir(type)

  if (variantKey) {
    const variantHintPath = resolve(dir, `credentials_hint_${variantKey}.md`)
    if (existsSync(variantHintPath)) {
      try {
        const content = readFileSync(variantHintPath, 'utf8').trim()
        if (content.length)
          return content
      }
      catch {}
    }
  }

  const fallbackPath = resolve(dir, 'credentials_hint.md')
  if (!existsSync(fallbackPath))
    return null
  try {
    const content = readFileSync(fallbackPath, 'utf8').trim()
    return content.length ? content : null
  }
  catch {
    return null
  }
}

export interface IntegrationCatalogItem {
  type: string
  name: string
}

export function listIntegrationTypes(): string[] {
  const root = integrationDataRoot()
  try {
    return readdirSync(root).filter((entry: string) => {
      try {
        return statSync(resolve(root, entry)).isDirectory()
      }
      catch {
        return false
      }
    })
  }
  catch {
    return []
  }
}

export function listIntegrationCatalog(): IntegrationCatalogItem[] {
  const types = listIntegrationTypes()
  const items: IntegrationCatalogItem[] = []
  for (const type of types) {
    try {
      const manifest = loadIntegrationManifest(type)
      if (!manifest)
        continue
      items.push({ type, name: manifest.name || type })
    }
    catch {
      // ignore broken integration directories
    }
  }
  return items
}
