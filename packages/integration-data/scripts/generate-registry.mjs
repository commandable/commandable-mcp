import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const packageDir = dirname(scriptDir)
const integrationsDir = join(packageDir, 'integrations')
const outputFile = join(packageDir, 'src', 'generated', 'registry.ts')

function readJson(text) {
  return JSON.parse(text)
}

async function readOptionalText(path, { trim = false } = {}) {
  if (!existsSync(path))
    return null

  const content = await readFile(path, 'utf8')
  if (!trim)
    return content

  const trimmed = content.trim()
  return trimmed.length ? trimmed : null
}

async function resolvePreprocess(dir, preprocess) {
  if (!preprocess || typeof preprocess !== 'object' || Array.isArray(preprocess))
    return preprocess ?? undefined
  if (preprocess.type !== 'handler')
    throw new Error(`Unsupported credentials preprocess type '${String(preprocess.type)}'.`)
  if (typeof preprocess.handler !== 'string' || !preprocess.handler.trim())
    throw new Error('Handler preprocess config requires a non-empty handler path.')

  const handlerCode = (await readFile(join(dir, preprocess.handler), 'utf8')).trim()
  return {
    type: 'handler',
    handlerCode,
    allowedOrigins: Array.isArray(preprocess.allowedOrigins) ? preprocess.allowedOrigins : undefined,
  }
}

async function loadTools(dir, tools, sharedUtils) {
  return await Promise.all((tools || []).map(async (tool) => {
    const inputSchema = readJson(await readFile(join(dir, tool.inputSchema), 'utf8'))
    const handlerCode = (await readFile(join(dir, tool.handler), 'utf8')).trim()

    return {
      name: tool.name,
      description: tool.description,
      inputSchema,
      handlerCode,
      utils: Array.isArray(sharedUtils) ? sharedUtils : undefined,
      scope: tool.scope,
      credentialVariants: tool.credentialVariants,
      toolset: tool.toolset,
      injectFromConfig: tool.injectFromConfig,
    }
  }))
}

function resolveVariantTool(tool, parentToolsByName, variantDir, parentDir) {
  const inherited = parentToolsByName.get(tool.from || tool.name)
  const inheritedInputSchema = inherited?.inputSchema
    ? relative(variantDir, join(parentDir, inherited.inputSchema))
    : undefined
  const inheritedHandler = inherited?.handler
    ? relative(variantDir, join(parentDir, inherited.handler))
    : undefined

  const resolved = {
    name: tool.name,
    description: tool.description ?? inherited?.description,
    inputSchema: tool.inputSchema ?? inheritedInputSchema,
    handler: tool.handler ?? inheritedHandler,
    scope: tool.scope ?? inherited?.scope,
    credentialVariants: tool.credentialVariants ?? inherited?.credentialVariants,
    toolset: tool.toolset ?? inherited?.toolset,
    injectFromConfig: inherited?.injectFromConfig || tool.injectFromConfig
      ? { ...(inherited?.injectFromConfig || {}), ...(tool.injectFromConfig || {}) }
      : undefined,
  }

  if (!resolved.description || !resolved.inputSchema || !resolved.handler) {
    throw new Error(`Variant tool '${tool.name}' in '${tool.from || tool.name}' is missing required resolved fields.`)
  }

  return resolved
}

async function main() {
  const registry = {}

  const integrationDirs = (await readdir(integrationsDir, { withFileTypes: true }))
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort((a, b) => a.localeCompare(b))

  for (const type of integrationDirs) {
    const dir = join(integrationsDir, type)
    const manifestPath = join(dir, 'manifest.json')
    if (!existsSync(manifestPath))
      continue

    const manifest = readJson(await readFile(manifestPath, 'utf8'))
    const prompt = await readOptionalText(join(dir, 'prompt.md'))
    const variantsPath = join(dir, 'credentials.json')
    const variants = existsSync(variantsPath)
      ? readJson(await readFile(variantsPath, 'utf8'))
      : null
    if (variants?.variants && typeof variants.variants === 'object') {
      for (const variant of Object.values(variants.variants)) {
        if (!variant || typeof variant !== 'object')
          continue
        variant.preprocess = await resolvePreprocess(dir, variant.preprocess)
      }
    }
    const hint = await readOptionalText(join(dir, 'credentials_hint.md'), { trim: true })

    const hintsByVariant = {}
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (!entry.isFile())
        continue
      const match = entry.name.match(/^credentials_hint_(.+)\.md$/)
      if (!match)
        continue
      const variantHint = await readOptionalText(join(dir, entry.name), { trim: true })
      if (variantHint)
        hintsByVariant[match[1]] = variantHint
    }

    const tools = await loadTools(dir, manifest.tools, manifest.utils)
    const parentToolsByName = new Map((manifest.tools || []).map(tool => [tool.name, tool]))

    registry[type] = {
      manifest: {
        name: manifest.name,
        version: manifest.version,
        baseUrl: manifest.baseUrl,
        allowedOrigins: manifest.allowedOrigins,
        utils: manifest.utils,
        toolsets: manifest.toolsets,
          tools: manifest.tools || [],
      },
      prompt,
      variants,
      hint,
      hintsByVariant,
      tools,
      variantOwnerType: null,
    }

    for (const variantRef of manifest.variants || []) {
      const variantPath = join(dir, variantRef.manifest)
      const variantDir = dirname(variantPath)
      const variantManifest = readJson(await readFile(variantPath, 'utf8'))
      const variantType = variantManifest.type || variantRef.type
      if (!variantType)
        throw new Error(`Variant in '${type}' is missing a type.`)
      if (variantManifest.type && variantRef.type && variantManifest.type !== variantRef.type)
        throw new Error(`Variant type mismatch in '${type}': '${variantManifest.type}' !== '${variantRef.type}'.`)
      if (registry[variantType])
        throw new Error(`Duplicate integration type '${variantType}'.`)

      const resolvedVariantTools = (variantManifest.tools || []).map(tool =>
        resolveVariantTool(tool, parentToolsByName, variantDir, dir),
      )

      registry[variantType] = {
        manifest: {
          name: manifest.name,
          version: manifest.version,
          baseUrl: manifest.baseUrl,
          allowedOrigins: manifest.allowedOrigins,
          utils: variantManifest.utils ?? manifest.utils,
          toolsets: variantManifest.toolsets ?? manifest.toolsets,
          variantLabel: variantManifest.variantLabel,
          variantConfig: variantManifest.variantConfig,
          tools: resolvedVariantTools,
        },
        prompt,
        variants,
        hint,
        hintsByVariant,
        tools: await loadTools(variantDir, resolvedVariantTools, variantManifest.utils ?? manifest.utils),
        variantOwnerType: type,
      }
    }
  }

  const source = `import type { GeneratedIntegrationEntry } from '../types.js'

export const GENERATED_INTEGRATIONS: Record<string, GeneratedIntegrationEntry> = ${JSON.stringify(registry, null, 2)}
`

  await mkdir(dirname(outputFile), { recursive: true })
  await writeFile(outputFile, source)
}

await main()
