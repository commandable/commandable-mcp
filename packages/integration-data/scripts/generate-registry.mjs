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

async function collectManifestDirs(rootDir) {
  const out = []

  async function walk(dir) {
    if (existsSync(join(dir, 'manifest.json')))
      out.push(dir)

    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory())
        continue
      await walk(join(dir, entry.name))
    }
  }

  const rootEntries = await readdir(rootDir, { withFileTypes: true })
  for (const entry of rootEntries) {
    if (!entry.isDirectory())
      continue
    await walk(join(rootDir, entry.name))
  }

  return out.sort((a, b) => relative(rootDir, a).localeCompare(relative(rootDir, b)))
}

function deriveIntegrationType(rootDir, dir) {
  const rel = relative(rootDir, dir)
  const segments = rel.split(/[\\/]+/).filter(Boolean)
  const variantIndex = segments.indexOf('variants')
  if (variantIndex >= 0 && segments[variantIndex + 1])
    return segments[variantIndex + 1]
  return segments[0]
}

async function main() {
  const registry = {}

  const manifestDirs = await collectManifestDirs(integrationsDir)
  for (const dir of manifestDirs) {
    const type = deriveIntegrationType(integrationsDir, dir)
    const manifestPath = join(dir, 'manifest.json')

    const manifest = readJson(await readFile(manifestPath, 'utf8'))
    const prompt = await readOptionalText(join(dir, 'prompt.md'))
    const variantsPath = join(dir, 'credentials.json')
    const variants = existsSync(variantsPath)
      ? readJson(await readFile(variantsPath, 'utf8'))
      : null
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

    const tools = await Promise.all((manifest.tools || []).map(async (tool) => {
      const inputSchema = readJson(await readFile(join(dir, tool.inputSchema), 'utf8'))
      const handlerCode = (await readFile(join(dir, tool.handler), 'utf8')).trim()

      return {
        name: tool.name,
        description: tool.description,
        inputSchema,
        handlerCode,
        utils: Array.isArray(manifest.utils) ? manifest.utils : undefined,
        scope: tool.scope,
        credentialVariants: tool.credentialVariants,
        toolset: tool.toolset,
        injectFromConfig: tool.injectFromConfig,
      }
    }))

    if (registry[type])
      throw new Error(`Duplicate integration type '${type}' from '${relative(integrationsDir, dir)}'`)

    registry[type] = {
      manifest,
      prompt,
      variants,
      hint,
      hintsByVariant,
      tools,
    }
  }

  const source = `import type { GeneratedIntegrationEntry } from '../types.js'

export const GENERATED_INTEGRATIONS: Record<string, GeneratedIntegrationEntry> = ${JSON.stringify(registry, null, 2)}
`

  await mkdir(dirname(outputFile), { recursive: true })
  await writeFile(outputFile, source)
}

await main()
