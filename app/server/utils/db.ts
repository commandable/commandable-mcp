import { createApiKey, createDbFromEnv, ensureSchema, hashApiKey, lookupApiKeyByHash } from '@commandable/mcp-core'

async function ensureBootstrapApiKey(db: Awaited<ReturnType<typeof createDbFromEnv>>) {
  const rawKey = String(process.env.COMMANDABLE_BOOTSTRAP_API_KEY || '').trim()
  if (!rawKey)
    return

  const existing = await lookupApiKeyByHash(db, hashApiKey(rawKey))
  if (existing)
    return

  const name = String(process.env.COMMANDABLE_BOOTSTRAP_API_KEY_NAME || 'bootstrap').trim() || 'bootstrap'
  await createApiKey(db, {
    id: `bootstrap-${hashApiKey(rawKey).slice(0, 16)}`,
    name,
    rawKey,
  })
}

interface DbState {
  ready: Promise<ReturnType<typeof createDbFromEnv>>
}

declare global {

  var __commandableMcpDbState: DbState | undefined
}

function initOnce(): DbState {
  return {
    ready: Promise.resolve(createDbFromEnv()).then(async (db) => {
      await ensureSchema(db)
      await ensureBootstrapApiKey(db)
      return db
    }),
  }
}

export async function getDb() {
  globalThis.__commandableMcpDbState ||= initOnce()
  return await globalThis.__commandableMcpDbState.ready
}
