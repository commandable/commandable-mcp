import { defineEventHandler, getHeader, setResponseStatus } from 'h3'
import { hashApiKey, lookupApiKeyByHash } from '@commandable/mcp'
import { getDb } from '../utils/db'

declare module 'h3' {
  interface H3EventContext {
    auth?: {
      type: 'bearer'
      apiKeyId: string
      name: string
      scopes: any
    }
  }
}

function isMcpPath(pathname: string): boolean {
  return pathname === '/mcp' || pathname.startsWith('/mcp/')
}

export default defineEventHandler(async (event) => {
  if (!isMcpPath(event.path))
    return

  const value = String(getHeader(event, 'authorization') || '')
  const m = value.match(/^Bearer\s+(.+)\s*$/i)
  const token = m?.[1]?.trim()
  if (!token) {
    setResponseStatus(event, 401)
    return { error: 'Missing bearer token' }
  }

  const db = await getDb()
  const keyHash = hashApiKey(token)
  const row = await lookupApiKeyByHash(db, keyHash)
  if (!row) {
    setResponseStatus(event, 401)
    return { error: 'Invalid API key' }
  }

  event.context.auth = {
    type: 'bearer',
    apiKeyId: row.id,
    name: row.name,
    scopes: row.scopesJson ?? null,
  }
})

