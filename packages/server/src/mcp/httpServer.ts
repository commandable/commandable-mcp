import type { Implementation } from '@modelcontextprotocol/sdk/types.js'
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { randomUUID } from 'node:crypto'
import { registerToolHandlers, type ToolIndex } from './handlers.js'

export interface HttpMcpServerParams {
  serverInfo: Implementation
  tools: ToolIndex
  port: number
  authMiddleware?: any
}

function getHeader(req: any, name: string): string | undefined {
  const v = req?.headers?.[name.toLowerCase()]
  if (Array.isArray(v))
    return v[0]
  if (typeof v === 'string')
    return v
  return undefined
}

export async function runHttpMcpServer(params: HttpMcpServerParams): Promise<void> {
  const { default: express } = await import('express')

  const server = new Server(params.serverInfo, {
    capabilities: {
      tools: {},
    },
  })

  registerToolHandlers(server, params.tools)

  const app = express()
  app.use(express.json({ limit: '1mb' }))

  app.get('/health', (_req: any, res: any) => res.json({ ok: true }))

  if (params.authMiddleware)
    app.use('/mcp', params.authMiddleware)

  const transports = new Map<string, StreamableHTTPServerTransport>()

  async function createTransport(): Promise<StreamableHTTPServerTransport> {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      enableJsonResponse: true,
    })

    transport.onclose = () => {
      const sid = transport.sessionId
      if (sid)
        transports.delete(sid)
    }

    await server.connect(transport)
    const sid = transport.sessionId
    if (sid)
      transports.set(sid, transport)
    return transport
  }

  app.post('/mcp', async (req: any, res: any) => {
    try {
      const sessionId = getHeader(req, 'mcp-session-id')

      if (sessionId && transports.has(sessionId)) {
        const transport = transports.get(sessionId)!
        await transport.handleRequest(req, res, req.body)
        return
      }

      if (!sessionId && isInitializeRequest(req.body)) {
        const transport = await createTransport()
        await transport.handleRequest(req, res, req.body)
        return
      }

      res.status(400).json({
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Bad Request: No valid session ID provided' },
        id: null,
      })
    }
    catch (err) {
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal server error' },
          id: null,
        })
      }
      // eslint-disable-next-line no-console
      console.error(err)
    }
  })

  app.get('/mcp', async (req: any, res: any) => {
    try {
      const sessionId = getHeader(req, 'mcp-session-id')
      if (!sessionId || !transports.has(sessionId)) {
        res.status(400).send('Invalid or missing session ID')
        return
      }

      const transport = transports.get(sessionId)!
      await transport.handleRequest(req, res)
    }
    catch (err) {
      if (!res.headersSent)
        res.status(500).send('Internal server error')
      // eslint-disable-next-line no-console
      console.error(err)
    }
  })

  app.delete('/mcp', async (req: any, res: any) => {
    try {
      const sessionId = getHeader(req, 'mcp-session-id')
      if (!sessionId || !transports.has(sessionId)) {
        res.status(400).send('Invalid or missing session ID')
        return
      }

      const transport = transports.get(sessionId)!
      await transport.handleRequest(req, res)
    }
    catch (err) {
      if (!res.headersSent)
        res.status(500).send('Error processing session termination')
      // eslint-disable-next-line no-console
      console.error(err)
    }
  })

  await new Promise<void>((resolve) => {
    app.listen(params.port, () => resolve())
  })
}

