import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { loadIntegrationManifest } from '../../../src/integrations/dataLoader.js'

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

describe('google-sheet static usage parity', () => {
  it('every manifest tool is referenced in tests via build*(name)', () => {
    const manifest = loadIntegrationManifest('google-sheet')!
    const toolNames = (manifest.tools as any[]).map(t => t.name)

    const testsDir = fileURLToPath(new URL('.', import.meta.url))
    expect(existsSync(testsDir)).toBe(true)
    const testFiles = readdirSync(testsDir)
      .filter(f => /\.test\.(t|j)s$/.test(f) && !f.includes('usage_parity.test'))
      .map(f => resolve(testsDir, f))

    const fileContents = testFiles.map(f => readFileSync(f, 'utf8'))

    const missing: string[] = []
    for (const name of toolNames) {
      // Matches buildRead('x'), buildWrite('x'), buildAdmin('x'), buildHandler('x'), buildReadHandler('x'), buildWriteHandler('x')
      const nameRe = new RegExp(`build(?:Read|Write|Admin)?(?:Handler)?\\(\\s*['\"\`]${escapeRegExp(name)}['\"\`]\\s*\\)`, 'm')
      const found = fileContents.some(src => nameRe.test(src))
      if (!found)
        missing.push(name)
    }

    expect(missing, `Missing handler usages in tests: ${missing.join(', ')}`).toEqual([])
  })
})
