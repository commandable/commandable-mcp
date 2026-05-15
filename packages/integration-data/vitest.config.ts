import { existsSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config as loadDotenv } from 'dotenv'
import { defineConfig } from 'vitest/config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..', '..')
const integrationsRoot = path.join(__dirname, 'integrations')

function loadEnvFile(filePath: string) {
  if (existsSync(filePath))
    loadDotenv({ path: filePath, override: true })
}

/**
 * Live handler tests read process.env only (no runtime .env loading in test files).
 *
 * When INTEGRATION_TESTS_ENV_FILE is set: load that file only (absolute or cwd-relative).
 * Otherwise load in order (later files override duplicate keys):
 * 1. {monorepo root}/.env.test
 * 2. {this package}/.env.test
 * 3. {this package}/integrations/<each>/.env.test (directories only, sorted)
 * 4. {this package}/.env.test.google (shared Google vars for calendar/gmail/workspace)
 */
const explicit = process.env.INTEGRATION_TESTS_ENV_FILE
if (explicit) {
  const resolved = path.isAbsolute(explicit)
    ? explicit
    : path.resolve(process.cwd(), explicit)
  loadEnvFile(resolved)
}
else {
  loadEnvFile(path.join(repoRoot, '.env.test'))
  loadEnvFile(path.join(__dirname, '.env.test'))

  if (existsSync(integrationsRoot)) {
    const names = readdirSync(integrationsRoot).sort()
    for (const name of names) {
      const dir = path.join(integrationsRoot, name)
      if (!statSync(dir).isDirectory())
        continue
      loadEnvFile(path.join(dir, '.env.test'))
    }
  }

  loadEnvFile(path.join(__dirname, '.env.test.google'))
}

export default defineConfig({
  resolve: {
    /**
     * Live tests import `@commandable/mcp-core` source, which calls `loadIntegrationVariants` from this package.
     * Node would otherwise resolve `@commandable/integration-data` to `dist/`, which is often stale or missing
     * after `generate:registry` until a full package build — then the proxy throws
     * `Provider 'wise' does not support credentials-based auth yet` (null type config).
     */
    alias: {
      '@commandable/integration-data': path.join(__dirname, 'src/index.ts'),
    },
  },
  test: {
    include: ['integrations/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
  },
})
