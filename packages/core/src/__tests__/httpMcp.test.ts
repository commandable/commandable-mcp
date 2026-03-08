import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  let nextSessionId = 0

  return {
    registerToolHandlers: vi.fn(),
    getDb: vi.fn(async () => ({ dialect: 'sqlite' })),
    listIntegrations: vi.fn(async () => []),
    listToolDefinitions: vi.fn(async () => []),
    listIntegrationTypeConfigs: vi.fn(async () => []),
    buildMcpToolIndex: vi.fn(() => ({ tools: [{ name: 'list_tools', inputSchema: {} }], byName: new Map() })),
    serverClose: vi.fn(async () => {}),
    serverConnect: vi.fn(async () => {}),
    transportHandleRequest: vi.fn(async () => {}),
    reset() {
      nextSessionId = 0
      this.registerToolHandlers.mockClear()
      this.getDb.mockClear()
      this.listIntegrations.mockClear()
      this.listToolDefinitions.mockClear()
      this.listIntegrationTypeConfigs.mockClear()
      this.buildMcpToolIndex.mockClear()
      this.serverClose.mockClear()
      this.serverConnect.mockClear()
      this.transportHandleRequest.mockClear()
    },
    nextSessionId() {
      nextSessionId += 1
      return `session-${nextSessionId}`
    },
  }
})

vi.mock('../../../../app/server/utils/db', () => ({
  getDb: mocks.getDb,
}))

vi.mock('@commandable/mcp-core', () => ({
  AbilityCatalog: class AbilityCatalog {
    constructor(_args: any) {}
  },
  IntegrationProxy: class IntegrationProxy {
    constructor(_args: any) {}
  },
  SessionAbilityState: class SessionAbilityState {
    cleanup(_sessionId: string | undefined) {}
  },
  SqlCredentialStore: class SqlCredentialStore {
    constructor(_db: any, _secret: string) {}
  },
  buildMcpToolIndex: mocks.buildMcpToolIndex,
  getOrCreateEncryptionSecret: () => 'secret',
  listIntegrations: mocks.listIntegrations,
  listToolDefinitions: mocks.listToolDefinitions,
  listIntegrationTypeConfigs: mocks.listIntegrationTypeConfigs,
  registerToolHandlers: mocks.registerToolHandlers,
}))

vi.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: class Server {
    constructor(_info: any, _options: any) {}
    async connect(transport: any) {
      await mocks.serverConnect(transport)
    }
    async close() {
      await mocks.serverClose()
    }
  },
}))

vi.mock('@modelcontextprotocol/sdk/server/streamableHttp.js', () => ({
  StreamableHTTPServerTransport: class StreamableHTTPServerTransport {
    sessionId: string
    onclose?: () => void

    constructor(_options: any) {
      this.sessionId = mocks.nextSessionId()
    }

    async handleRequest(req: any, res: any, body: any) {
      await mocks.transportHandleRequest(req, res, body)
    }
  },
}))

import { handleMcpHttp, refreshMcpState } from '../../../../app/server/utils/mcp'

function initializeBody() {
  return {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test-client', version: '0.0.0' },
    },
  }
}

function makeArgs(endpoint: 'static' | 'create', opts?: {
  method?: 'GET' | 'POST'
  sessionId?: string
  authApiKeyId?: string | null
  body?: any
}) {
  const headers: Record<string, string> = {}
  if (opts?.sessionId)
    headers['mcp-session-id'] = opts.sessionId

  return {
    nodeReq: { method: opts?.method ?? 'POST', headers },
    nodeRes: {},
    body: opts?.body ?? initializeBody(),
    endpoint,
    authApiKeyId: opts?.authApiKeyId ?? 'api-key-1',
  } as const
}

describe('HTTP MCP endpoint routing', () => {
  beforeEach(async () => {
    await refreshMcpState()
    mocks.reset()
  })

  it('registers static HTTP MCP without create-mode helpers', async () => {
    const result = await handleMcpHttp(makeArgs('static'))

    expect(result).toEqual({ kind: 'handled' })
    expect(mocks.registerToolHandlers).toHaveBeenCalledTimes(1)
    expect(mocks.registerToolHandlers.mock.calls[0]?.[2]).toBeUndefined()
  })

  it('registers create HTTP MCP with create-mode helpers', async () => {
    const result = await handleMcpHttp(makeArgs('create'))

    expect(result).toEqual({ kind: 'handled' })
    expect(mocks.registerToolHandlers).toHaveBeenCalledTimes(1)
    expect(mocks.registerToolHandlers.mock.calls[0]?.[2]).toMatchObject({
      catalogRef: expect.any(Object),
      sessionState: expect.any(Object),
      ctx: expect.any(Object),
    })
  })

  it('does not reuse sessions across endpoints', async () => {
    await handleMcpHttp(makeArgs('static'))

    const result = await handleMcpHttp(makeArgs('create', {
      method: 'GET',
      sessionId: 'session-1',
      body: undefined,
    }))

    expect(result).toEqual({
      kind: 'error',
      statusCode: 400,
      message: 'Invalid or missing session ID',
    })
    expect(mocks.transportHandleRequest).toHaveBeenCalledTimes(1)
  })

  it('rejects resuming a session with a different API key', async () => {
    await handleMcpHttp(makeArgs('create', { authApiKeyId: 'api-key-1' }))

    const result = await handleMcpHttp(makeArgs('create', {
      method: 'GET',
      sessionId: 'session-1',
      body: undefined,
      authApiKeyId: 'api-key-2',
    }))

    expect(result).toEqual({
      kind: 'error',
      statusCode: 403,
      message: 'Session does not belong to the authenticated API key',
    })
    expect(mocks.transportHandleRequest).toHaveBeenCalledTimes(1)
  })

  it('refreshes both endpoint caches and closes their sessions', async () => {
    await handleMcpHttp(makeArgs('static'))
    await handleMcpHttp(makeArgs('create'))

    await refreshMcpState()

    expect(mocks.serverClose).toHaveBeenCalledTimes(2)
  })
})
