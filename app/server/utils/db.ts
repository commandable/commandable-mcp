import { createDbFromEnv } from '@commandable/mcp-core'

type DbState = {
  ready: Promise<ReturnType<typeof createDbFromEnv>>
}

declare global {

  var __commandableMcpDbState: DbState | undefined
}

function initOnce(): DbState {
  return {
    ready: Promise.resolve(createDbFromEnv())
  }
}

export async function getDb() {
  globalThis.__commandableMcpDbState ||= initOnce()
  return await globalThis.__commandableMcpDbState.ready
}
