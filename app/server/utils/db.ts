import { createDbFromEnv, ensureSchema } from '@commandable/mcp'
import { createError } from 'h3'

const REQUIRED_INTEGRATION_COLUMNS = [
  'id', 'space_id', 'type', 'reference_id', 'label', 'enabled',
  'connection_method', 'connection_id', 'credential_id', 'credential_variant',
  'config_json', 'enabled_toolsets', 'max_scope', 'disabled_tools', 'created_at',
]

type DbState = {
  ready: Promise<ReturnType<typeof createDbFromEnv>>
}

declare global {
  // eslint-disable-next-line no-var
  var __commandableMcpDbState: DbState | undefined
}

function initOnce(): DbState {
  return {
    ready: (async () => {
      const client = createDbFromEnv()
      await ensureSchema(client)

      if (client.dialect === 'sqlite') {
        const cols: Array<{ name: string }> = client.raw.prepare('PRAGMA table_info(integrations)').all() as any
        const colNames = new Set(cols.map(c => c.name))
        const missing = REQUIRED_INTEGRATION_COLUMNS.filter(c => !colNames.has(c))
        if (missing.length) {
          const dbPath = process.env.COMMANDABLE_DB_PATH || `${process.env.HOME}/.commandable/credentials.sqlite`
          throw createError({
            statusCode: 500,
            statusMessage: `Database is out of date (missing: ${missing.join(', ')}). Delete it and restart: rm ${dbPath}`,
          })
        }
      }

      return client
    })(),
  }
}

export async function getDb() {
  globalThis.__commandableMcpDbState ||= initOnce()
  return await globalThis.__commandableMcpDbState.ready
}

