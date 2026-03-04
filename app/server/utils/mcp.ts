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
import type { MetaToolContext } from '@commandable/mcp'

type SharedState = {
  spaceId: string
  db: any
  credentialStore: SqlCredentialStore
  proxy: IntegrationProxy
  toolIndexRef: { list: Array<{ name: string, description?: string, inputSchema: any }>, byName: Map<string, any> }
  sessionState?: SessionAbilityState
  catalogRef?: { current: AbilityCatalog }
  ctx?: MetaToolContext
}

type McpState = {
  shared: SharedState
  sessions: Map<string, { server: Server, transport: StreamableHTTPServerTransport }>
}

declare global {
  // eslint-disable-next-line no-var
  var __commandableMcpHttpState: McpState | undefined
}

function getSpaceId(): string {
  const v = process.env.COMMANDABLE_SPACE_ID
  return v && v.trim().length ? v.trim() : 'local'
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
  const integrationsRef = { current: integrations }

  const proxy = new IntegrationProxy({
    credentialStore,
    trelloApiKey: process.env.TRELLO_API_KEY,
  })

  const index = buildMcpToolIndex({ spaceId, integrations, proxy, integrationsRef })
  const toolIndexRef = { list: index.tools, byName: index.byName }

  const mode = resolveMode()
  const port = (process.env.PORT || '').trim() || '23432'
  const host = (process.env.HOST || '').trim() || '127.0.0.1'
  const credentialSetupBaseUrl = `http://${host}:${port}`

  const sessionState = mode === 'create' ? new SessionAbilityState() : undefined
  const catalogRef = mode === 'create'
    ? { current: new AbilityCatalog({ integrations: integrationsRef.current, toolIndex: toolIndexRef.byName }) }
    : undefined
  const ctx: MetaToolContext | undefined = mode === 'create'
    ? {
        spaceId,
        db,
        credentialStore,
        proxy,
        credentialSetupBaseUrl,
        integrationsRef,
        toolIndexRef,
        catalogRef: catalogRef!,
      }
    : undefined

  const state: McpState = {
    shared: {
      spaceId,
      db,
      credentialStore,
      proxy,
      toolIndexRef,
      sessionState,
      catalogRef,
      ctx,
    },
    sessions: new Map(),
  }

  globalThis.__commandableMcpHttpState = state
  return state
}

/** Tear down the singleton so the next request re-builds tools and Server. */
export async function refreshMcpState(): Promise<void> {
  const prev = globalThis.__commandableMcpHttpState
  if (prev) {
    for (const sess of prev.sessions.values()) {
      try { await sess.server.close() } catch {}
    }
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
  const shared = state.shared
  const req = args.nodeReq
  const res = args.nodeRes
  const method = String(req?.method || 'GET').toUpperCase()

  const sessionId = getHeader(req, 'mcp-session-id')
  const existing = sessionId ? state.sessions.get(sessionId) : undefined

  if (existing) {
    await existing.transport.handleRequest(req, res, args.body)
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

  const server = new Server(getServerInfo(), {
    capabilities: { tools: { listChanged: true } },
  })
  registerToolHandlers(
    server,
    shared.toolIndexRef,
    resolveMode() === 'create' && shared.sessionState && shared.catalogRef && shared.ctx
      ? { catalogRef: shared.catalogRef, sessionState: shared.sessionState, ctx: shared.ctx }
      : undefined,
  )

  transport.onclose = () => {
    const sid = transport.sessionId
    if (sid) {
      state.sessions.delete(sid)
      shared.sessionState?.cleanup(sid)
    }
  }

  await server.connect(transport)
  const sid = transport.sessionId
  if (sid)
    state.sessions.set(sid, { server, transport })

  await transport.handleRequest(req, res, args.body)
  return { kind: 'handled' }
}
