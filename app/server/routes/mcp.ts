import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import { handleMcpHttp } from '../utils/mcp'

export default defineEventHandler(async (event) => {
  const method = event.node.req.method || 'GET'
  const body = method === 'POST' ? await readBody(event) : undefined

  const result = await handleMcpHttp({
    nodeReq: event.node.req,
    nodeRes: event.node.res,
    body,
    endpoint: 'dynamic',
    authApiKeyId: event.context.auth?.apiKeyId ?? null,
  })

  if (result.kind === 'handled') {
    event._handled = true
    return
  }

  setResponseStatus(event, result.statusCode)
  return {
    jsonrpc: '2.0',
    error: { code: -32000, message: result.message },
    id: null,
  }
})
