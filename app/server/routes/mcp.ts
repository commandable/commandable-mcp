import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import { handleMcpHttp } from '../utils/mcp'

export default defineEventHandler(async (event) => {
  const method = event.node.req.method || 'GET'
  const body = method === 'POST' ? await readBody(event) : undefined

  const result = await handleMcpHttp({
    nodeReq: event.node.req,
    nodeRes: event.node.res,
    body,
  })

  if (result.kind === 'error') {
    setResponseStatus(event, result.statusCode)
    return result.message
  }

  return undefined
})

