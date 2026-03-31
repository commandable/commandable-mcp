#!/usr/bin/env node
/**
 * Run @commandable/integration-data Vitest suite from repo root.
 *
 * Usage:
 *   node scripts/run-integration-tests.mjs              # all integration tests
 *   node scripts/run-integration-tests.mjs github       # only integrations/github/**
 *   node scripts/run-integration-tests.mjs --github     # same (leading -- stripped)
 *
 * Yarn (from repo root):
 *   yarn test:integrations
 *   yarn test:integrations github
 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.join(__dirname, '..')
const integrationDataDir = path.join(repoRoot, 'packages', 'integration-data')

const raw = process.argv.slice(2).filter(Boolean)
const first = raw[0]?.replace(/^--/, '') ?? ''
const filterPath = first
  ? (first.startsWith('integrations/') ? first : `integrations/${first}`)
  : ''

if (filterPath) {
  const dir = path.join(integrationDataDir, filterPath)
  if (!existsSync(dir)) {
    console.error(`Unknown integration path: ${filterPath} (no directory at ${dir})`)
    process.exit(1)
  }
}

const vitestArgs = ['run', ...(filterPath ? [filterPath] : [])]

const result = spawnSync('yarn', ['exec', 'vitest', ...vitestArgs], {
  cwd: integrationDataDir,
  stdio: 'inherit',
  env: { ...process.env },
})

process.exit(result.status ?? 1)
