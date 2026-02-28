import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { existsSync } from 'node:fs'
import { config as dotenv } from 'dotenv'

const root = fileURLToPath(new URL('../..', import.meta.url))
const here = fileURLToPath(new URL('.', import.meta.url))

for (const f of ['.env.test', '.env.test.managed']) {
  const p = resolve(root, f)
  if (existsSync(p))
    dotenv({ path: p, override: false })
}

export default defineConfig({
  resolve: {
    alias: {
      '@commandable/integration-data': resolve(here, '../integration-data/src/index.ts'),
      '@commandable/integration-data/credentials': resolve(here, '../integration-data/src/credentials-index.ts'),
    },
  },
  test: {
    environment: 'node',
    include: [
      'src/__tests__/**/*.test.ts',
      '../integration-data/integrations/**/__tests__/**/*.test.ts',
    ],
  },
})

