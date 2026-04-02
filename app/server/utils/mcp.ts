import type { Implementation } from '@modelcontextprotocol/sdk/types.js'
import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from 'node:http'
import { randomUUID } from 'node:crypto'
import {
  AbilityCatalog,
  applyFileProcessingCapabilityToIntegrations,
  buildMcpToolIndex,
  getBuilderToolDefinitions,
  getFileProcessingCapability,
  getOrCreateEncryptionSecret,
  IntegrationProxy,
  listIntegrations,
  listIntegrationTypeConfigs,
  listToolDefinitions,
  registerToolHandlers,
  SessionAbilityState,
  SqlCredentialStore,
} from '@commandable/mcp-core'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js'
import { getDb } from './db'

export type HttpMcpEndpoint = 'static' | 'dynamic' | 'create'

interface SharedState {
  spaceId: string
  db: unknown
  credentialStore: SqlCredentialStore
  proxy: IntegrationProxy
  toolIndexRef: {
    list: ReturnType<typeof buildMcpToolIndex>['tools']
    byName: ReturnType<typeof buildMcpToolIndex>['byName']
  }
  sessionState?: SessionAbilityState
  catalogRef?: { current: AbilityCatalog }
  ctx?: any
}

interface SessionRecord {
  server: Server
  transport: StreamableHTTPServerTransport
  ownerApiKeyId: string | null
}

interface McpState {
  shared: SharedState
  sessions: Map<string, SessionRecord>
}

interface McpStateStore {
  byEndpoint: Partial<Record<HttpMcpEndpoint, McpState>>
}

declare global {

  var __commandableMcpHttpState: McpStateStore | undefined
}

function getSpaceId(): string {
  const v = process.env.COMMANDABLE_SPACE_ID
  return v && v.trim().length ? v.trim() : 'local'
}

function getServerInfo(): Implementation {
  return {
    name: 'commandable',
    version: (process.env.COMMANDABLE_VERSION || '').trim() || '0.0.0',
  }
}

function usesDynamicToolLoading(endpoint: HttpMcpEndpoint): boolean {
  return endpoint !== 'static'
}

function allowsBuilderTools(endpoint: HttpMcpEndpoint): boolean {
  return endpoint === 'create'
}

function getOrCreateStore(): McpStateStore {
  globalThis.__commandableMcpHttpState ||= { byEndpoint: {} }
  return globalThis.__commandableMcpHttpState
}

async function buildState(endpoint: HttpMcpEndpoint): Promise<McpState> {
  const dynamicMode = usesDynamicToolLoading(endpoint)
  const includeBuilderAbility = allowsBuilderTools(endpoint)

  const db = await getDb()
  const secret = getOrCreateEncryptionSecret()
  const credentialStore = new SqlCredentialStore(db, secret)
  const spaceId = getSpaceId()
  const fileProcessing = await getFileProcessingCapability()
  const integrations = applyFileProcessingCapabilityToIntegrations(
    await listIntegrations(db, spaceId),
    fileProcessing,
  )
  const toolDefinitions = await listToolDefinitions(db, spaceId)
  const integrationTypeConfigs = await listIntegrationTypeConfigs(db, spaceId)
  const integrationsRef = { current: integrations }
  const integrationTypeConfigsRef = { current: integrationTypeConfigs }

  const proxy = new IntegrationProxy({
    credentialStore,
    integrationTypeConfigsRef,
  })

  const index = buildMcpToolIndex({ spaceId, integrations, proxy, integrationsRef, toolDefinitions })
  const toolIndexRef = { list: index.tools, byName: index.byName }

  const port = (process.env.PORT || '').trim() || '23432'
  const host = (process.env.HOST || '').trim() || '127.0.0.1'
  const credentialSetupBaseUrl = `http://${host}:${port}`

  const sessionState = dynamicMode ? new SessionAbilityState() : undefined
  const extraToolDefinitions = new Map(
    (includeBuilderAbility ? getBuilderToolDefinitions() : []).map(definition => [definition.name, definition]),
  )
  const catalogRef = dynamicMode
    ? {
        current: new AbilityCatalog({
          integrations: integrationsRef.current,
          toolIndex: toolIndexRef.byName,
          extraToolDefinitions,
          includeBuilderAbility,
        }),
      }
    : undefined
  const ctx = includeBuilderAbility
    ? {
        spaceId,
        db,
        credentialStore,
        proxy,
        credentialSetupBaseUrl,
        integrationsRef,
        integrationTypeConfigsRef,
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

  return state
}

async function getOrCreateState(endpoint: HttpMcpEndpoint): Promise<McpState> {
  const store = getOrCreateStore()
  const existing = store.byEndpoint[endpoint]
  if (existing)
    return existing

  const state = await buildState(endpoint)
  store.byEndpoint[endpoint] = state
  return state
}

/** Tear down the singleton so the next request re-builds tools and Server. */
export async function refreshMcpState(): Promise<void> {
  const prev = globalThis.__commandableMcpHttpState
  if (prev) {
    for (const endpointState of Object.values(prev.byEndpoint)) {
      if (!endpointState)
        continue
      for (const sess of endpointState.sessions.values()) {
        try {
          await sess.server.close()
        }
        catch {
          // Ignore shutdown errors during state refresh.
        }
      }
    }
    globalThis.__commandableMcpHttpState = undefined
  }
}

interface HeaderReadable {
  headers?: IncomingHttpHeaders
}

function getHeader(req: HeaderReadable | undefined, name: string): string | undefined {
  const v = req?.headers?.[name.toLowerCase()]
  if (Array.isArray(v))
    return v[0]
  if (typeof v === 'string')
    return v
  return undefined
}

export interface McpHandleArgs {
  nodeReq: IncomingMessage
  nodeRes: ServerResponse
  body?: unknown
  endpoint: HttpMcpEndpoint
  authApiKeyId?: string | null
}

export async function handleMcpHttp(args: McpHandleArgs): Promise<
  | { kind: 'handled' }
  | { kind: 'error', statusCode: number, message: string }
> {
  const state = await getOrCreateState(args.endpoint)
  const shared = state.shared
  const req = args.nodeReq
  const res = args.nodeRes
  const method = String(req?.method || 'GET').toUpperCase()
  const ownerApiKeyId = args.authApiKeyId ?? null

  const sessionId = getHeader(req, 'mcp-session-id')
  const existing = sessionId ? state.sessions.get(sessionId) : undefined

  if (existing) {
    if (existing.ownerApiKeyId !== ownerApiKeyId) {
      return {
        kind: 'error',
        statusCode: 403,
        message: 'Session does not belong to the authenticated API key',
      }
    }
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
    {
      mode: args.endpoint,
      ...(usesDynamicToolLoading(args.endpoint) && shared.sessionState && shared.catalogRef
        ? {
            dynamicMode: {
              catalogRef: shared.catalogRef,
              sessionState: shared.sessionState,
              ctx: shared.ctx,
            },
          }
        : {}),
    },
  )

  transport.onclose = () => {
    const sid = transport.sessionId
    if (sid) {
      state.sessions.delete(sid)
      shared.sessionState?.cleanup(sid)
    }
  }

  await server.connect(transport)
  await transport.handleRequest(req, res, args.body)
  const sid = transport.sessionId
  if (sid)
    state.sessions.set(sid, { server, transport, ownerApiKeyId })
  return { kind: 'handled' }
}
