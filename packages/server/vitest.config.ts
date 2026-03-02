import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { existsSync, readdirSync } from 'node:fs'
import { config as dotenv } from 'dotenv'

const root = fileURLToPath(new URL('../..', import.meta.url))
const here = fileURLToPath(new URL('.', import.meta.url))

function loadEnv(path: string) {
  if (existsSync(path))
    dotenv({ path, override: false })
}

// Shared Google credentials (used by all google-* integrations)
for (const f of ['.env.test.google', '.env.test.google.managed']) {
  loadEnv(resolve(root, f))
}

// Per-integration env files
const integrationsDir = resolve(root, 'packages/integration-data/integrations')
for (const entry of readdirSync(integrationsDir, { withFileTypes: true })) {
  if (!entry.isDirectory() || entry.name.startsWith('.') || entry.name === '__tests__') continue
  const dir = resolve(integrationsDir, entry.name)
  loadEnv(resolve(dir, '.env.test'))
  loadEnv(resolve(dir, '.env.test.managed'))
}

const integration = process.env.VITEST_INTEGRATION

export default defineConfig({
  resolve: {
    alias: {
      '@commandable/integration-data': resolve(here, '../integration-data/src/index.ts'),
      '@commandable/integration-data/credentials': resolve(here, '../integration-data/src/credentials-index.ts'),
    },
  },
  test: {
    environment: 'node',
    include: integration
      ? [`../integration-data/integrations/${integration}/__tests__/**/*.test.ts`]
      : [
          'src/__tests__/**/*.test.ts',
          '../integration-data/integrations/**/__tests__/**/*.test.ts',
        ],
  },
})

