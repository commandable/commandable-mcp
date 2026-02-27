import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@commandable/integration-data': resolve(
        fileURLToPath(new URL('.', import.meta.url)),
        '../integration-data/src/index.ts',
      ),
      '@commandable/integration-data/credentials': resolve(
        fileURLToPath(new URL('.', import.meta.url)),
        '../integration-data/src/credentials-index.ts',
      ),
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

