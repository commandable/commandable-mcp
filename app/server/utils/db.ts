import { resolve } from 'node:path'
import { createDbFromEnv, ensureSchema } from '@commandable/mcp'

type DbState = {
  ready: Promise<ReturnType<typeof createDbFromEnv>>
}

declare global {
  // eslint-disable-next-line no-var
  var __commandableMcpDbState: DbState | undefined
}

function initOnce(): DbState {
  // Ensure integration-data is discoverable when the Nuxt app is run from `commandable-mcp/app`
  process.env.COMMANDABLE_INTEGRATION_DATA_DIR ||= resolve(process.cwd(), '..', 'integration-data')

  return {
    ready: (async () => {
      const client = createDbFromEnv()
      await ensureSchema(client)
      return client
    })(),
  }
}

export async function getDb() {
  globalThis.__commandableMcpDbState ||= initOnce()
  return await globalThis.__commandableMcpDbState.ready
}

