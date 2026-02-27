import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadIntegrationManifest } from '../../../server/src/integrations/dataLoader.js'

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function getMissingToolUsages(opts: { integrationName: string, importMetaUrl: string }): string[] {
  const manifest = loadIntegrationManifest(opts.integrationName)
  if (!manifest)
    throw new Error(`Missing integration manifest for '${opts.integrationName}'`)

  const toolNames = (manifest.tools as any[]).map(t => t.name)

  const testsDir = fileURLToPath(new URL('.', opts.importMetaUrl))
  if (!existsSync(testsDir))
    throw new Error(`Missing tests directory: ${testsDir}`)

  const testFiles = readdirSync(testsDir)
    .filter(f => /\.test\.(t|j)s$/.test(f) && !f.includes('usage_parity.test'))
    .map(f => resolve(testsDir, f))

  const fileContents = testFiles.map(f => readFileSync(f, 'utf8'))

  const missing: string[] = []
  for (const name of toolNames) {
    const nameRe = new RegExp(
      `(?:build(?:Read|Write|Admin)?(?:Handler)?|\\.(?:read|write|admin))\\(\\s*['\"\`]${escapeRegExp(name)}['\"\`]\\s*\\)`,
      'm',
    )
    const found = fileContents.some(src => nameRe.test(src))
    if (!found)
      missing.push(name)
  }

  return missing
}

