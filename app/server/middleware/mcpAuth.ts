import { hashApiKey, lookupApiKeyByHash } from '@commandable/mcp-core'
import { defineEventHandler, getHeader, setResponseStatus } from 'h3'
import { getDb } from '../utils/db'

const BEARER_PREFIX_RE = /^Bearer[ \t]+/i

declare module 'h3' {
  interface H3EventContext {
    auth?: {
      type: 'bearer'
      apiKeyId: string
      name: string
      scopes: unknown
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
  const prefix = BEARER_PREFIX_RE.exec(value)?.[0]
  const token = prefix ? value.slice(prefix.length).trim() : ''
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
