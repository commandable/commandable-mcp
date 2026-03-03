import type { Implementation } from '@modelcontextprotocol/sdk/types.js'
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { randomUUID } from 'node:crypto'
import {
  AbilityCatalog,
  IntegrationProxy,
  SessionAbilityState,
  SqlCredentialStore,
  buildMcpToolIndex,
  getOrCreateEncryptionSecret,
  listIntegrations,
  registerToolHandlers,
} from '@commandable/mcp'
import { getDb } from './db'

type McpState = {
  server: Server
  transports: Map<string, StreamableHTTPServerTransport>
  sessionState?: SessionAbilityState
}

declare global {
  // eslint-disable-next-line no-var
  var __commandableMcpHttpState: McpState | undefined
}

function getSpaceId(): string {
  return process.env.COMMANDABLE_SPACE_ID || 'local'
}

function getServerInfo(): Implementation {
  return { name: 'commandable', version: '0.0.1' }
}

function resolveMode(): 'static' | 'create' {
  const explicit = (process.env.COMMANDABLE_MODE || '').toLowerCase().trim()
  if (explicit === 'create')
    return 'create'
  return 'static'
}

async function getOrCreateState(): Promise<McpState> {
  if (globalThis.__commandableMcpHttpState)
    return globalThis.__commandableMcpHttpState

  const db = await getDb()
  const secret = getOrCreateEncryptionSecret()
  const credentialStore = new SqlCredentialStore(db, secret)
  const spaceId = getSpaceId()
  const integrations = await listIntegrations(db, spaceId)

  const proxy = new IntegrationProxy({
    credentialStore,
    trelloApiKey: process.env.TRELLO_API_KEY,
  })

  const index = buildMcpToolIndex({ spaceId, integrations, proxy })

  const mode = resolveMode()

  const server = new Server(getServerInfo(), {
    capabilities: { tools: { listChanged: true } },
  })

  const sessionState = mode === 'create' ? new SessionAbilityState() : undefined

  registerToolHandlers(
    server,
    { list: index.tools, byName: index.byName },
    mode === 'create'
      ? {
          catalog: new AbilityCatalog({ integrations, toolIndex: index.byName }),
          sessionState: sessionState!,
        }
      : undefined,
  )

  const state: McpState = {
    server,
    transports: new Map(),
    sessionState,
  }

  globalThis.__commandableMcpHttpState = state
  return state
}

/** Tear down the singleton so the next request re-builds tools and Server. */
export async function refreshMcpState(): Promise<void> {
  const prev = globalThis.__commandableMcpHttpState
  if (prev) {
    await prev.server.close()
    globalThis.__commandableMcpHttpState = undefined
  }
}

function getHeader(req: any, name: string): string | undefined {
  const v = req?.headers?.[name.toLowerCase()]
  if (Array.isArray(v))
    return v[0]
  if (typeof v === 'string')
    return v
  return undefined
}

export type McpHandleArgs = {
  nodeReq: any
  nodeRes: any
  body?: any
}

export async function handleMcpHttp(args: McpHandleArgs): Promise<
  | { kind: 'handled' }
  | { kind: 'error', statusCode: number, message: string }
> {
  const state = await getOrCreateState()
  const req = args.nodeReq
  const res = args.nodeRes
  const method = String(req?.method || 'GET').toUpperCase()

  const sessionId = getHeader(req, 'mcp-session-id')
  const existing = sessionId ? state.transports.get(sessionId) : undefined

  if (existing) {
    await existing.handleRequest(req, res, args.body)
    return { kind: 'handled' }
  }

  if (method !== 'POST')
    return { kind: 'error', statusCode: 400, message: 'Invalid or missing session ID' }

  if (!isInitializeRequest(args.body)) {
    return {
      kind: 'error',
      statusCode: 400,
      message: 'Bad Request: No valid session ID provided',
    }
  }

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    enableJsonResponse: true,
  })

  transport.onclose = () => {
    const sid = transport.sessionId
    if (sid) {
      state.transports.delete(sid)
      state.sessionState?.cleanup(sid)
    }
  }

  await state.server.connect(transport)
  const sid = transport.sessionId
  if (sid)
    state.transports.set(sid, transport)

  await transport.handleRequest(req, res, args.body)
  return { kind: 'handled' }
}
