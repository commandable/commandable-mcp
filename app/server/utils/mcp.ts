import type { Implementation } from '@modelcontextprotocol/sdk/types.js'
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { randomUUID } from 'node:crypto'
import {
  IntegrationProxy,
  SqlCredentialStore,
  buildMcpToolIndex,
  getOrCreateEncryptionSecret,
  listIntegrations,
  registerToolHandlers,
} from '@commandable/mcp'
import { getDb } from './db'

type McpSession = {
  transport: StreamableHTTPServerTransport
  server: Server
}

type McpState = {
  sessions: Map<string, McpSession>
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

function getOrCreateState(): McpState {
  globalThis.__commandableMcpHttpState ||= {
    sessions: new Map<string, McpSession>(),
  }
  return globalThis.__commandableMcpHttpState
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
  const state = getOrCreateState()
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

  const server = new Server(getServerInfo(), {
    capabilities: { tools: {} },
  })

  registerToolHandlers(server, { list: index.tools, byName: index.byName })

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    enableJsonResponse: true,
  })

  transport.onclose = () => {
    const sid = transport.sessionId
    if (sid)
      state.sessions.delete(sid)
  }

  await server.connect(transport)
  const sid = transport.sessionId
  if (sid)
    state.sessions.set(sid, { transport, server })

  await transport.handleRequest(req, res, args.body)
  return { kind: 'handled' }
}

