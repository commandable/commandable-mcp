import { Buffer } from 'node:buffer'
import { HttpError } from '../errors/httpError.js'
import type { IntegrationData } from '../types.js'
import { PROVIDERS } from './providerRegistry.js'
import { loadIntegrationCredentialConfig } from './dataLoader.js'
import { getGoogleAccessToken } from './googleServiceAccount.js'

export interface CredentialStore {
  getCredentials: (spaceId: string, credentialId: string) => Promise<Record<string, string> | null>
}

export interface IntegrationProxyOptions {
  // Optional: managed OAuth support. For self-hosted BYO creds, you can omit these.
  managedOAuthSecretKey?: string
  managedOAuthBaseUrl?: string

  trelloApiKey?: string
  credentialStore?: CredentialStore
}

export class IntegrationProxy {
  constructor(private readonly opts: IntegrationProxyOptions = {}) {}

  async call(integration: IntegrationData, path: string, init: RequestInit = {}): Promise<Response> {
    const { type: provider, connectionId } = integration

    if (!provider || !path)
      throw new HttpError(400, 'provider and path are required.')

    const joinWithoutDuplicateSegments = (baseUrl: string, rawPath: string): string => {
      let pathOnly = rawPath || ''
      let queryPart = ''
      const qIndex = pathOnly.indexOf('?')
      if (qIndex >= 0) {
        queryPart = pathOnly.slice(qIndex + 1)
        pathOnly = pathOnly.slice(0, qIndex)
      }

      try {
        const base = new URL(baseUrl)
        const baseSegs = base.pathname.split('/').filter(Boolean)
        const pathSegs = (pathOnly || '/').split('/').filter(Boolean)

        let overlap = 0
        const maxK = Math.min(baseSegs.length, pathSegs.length)
        for (let k = maxK; k >= 1; k--) {
          let ok = true
          for (let i = 0; i < k; i++) {
            if (baseSegs[baseSegs.length - k + i] !== pathSegs[i]) { ok = false; break }
          }
          if (ok) { overlap = k; break }
        }

        const normalizedPath = `/${[...baseSegs, ...pathSegs.slice(overlap)].join('/')}`
        const baseOrigin = base.origin
        const urlNoQuery = `${baseOrigin}${normalizedPath}`
        return queryPart ? `${urlNoQuery}?${queryPart}` : urlNoQuery
      }
      catch {
        const cleanedBase = baseUrl.replace(/\/+$/, '')
        const cleanedPath = (`/${(pathOnly || '').replace(/^\/+/, '')}`)
        const baseParts = cleanedBase.split('/').filter(Boolean)
        const pathParts = cleanedPath.split('/').filter(Boolean)
        let overlap = 0
        const maxK = Math.min(baseParts.length, pathParts.length)
        for (let k = maxK; k >= 1; k--) {
          let ok = true
          for (let i = 0; i < k; i++) {
            if (baseParts[baseParts.length - k + i] !== pathParts[i]) { ok = false; break }
          }
          if (ok) { overlap = k; break }
        }
        const joined = `/${[...baseParts, ...pathParts.slice(overlap)].join('/')}`
        return queryPart ? `${joined}?${queryPart}` : joined
      }
    }

    if (provider === 'http') {
      const cfg = integration.config || {}
      const baseUrl = cfg.baseUrl
      if (!baseUrl)
        throw new HttpError(400, 'HTTP integration requires a baseUrl in its config.')

      const authType = cfg.authType || 'none'
      const preparedInit: RequestInit = { ...init }
      if (preparedInit.body !== undefined && typeof preparedInit.body !== 'string') {
        preparedInit.body = JSON.stringify(preparedInit.body)
        preparedInit.headers = {
          'Content-Type': 'application/json',
          ...preparedInit.headers,
        }
      }

      const authHeaders: Record<string, string> = {}
      const authQuery = new URLSearchParams()
      if (authType === 'api_key_header' && cfg.apiKeyHeaderName && cfg.apiKey) {
        authHeaders[cfg.apiKeyHeaderName] = cfg.apiKey
      }
      else if (authType === 'api_key_query' && cfg.apiKeyQueryParam && cfg.apiKey) {
        authQuery.set(cfg.apiKeyQueryParam, cfg.apiKey)
      }
      else if (authType === 'basic' && cfg.basicUsername !== undefined && cfg.basicPassword !== undefined) {
        const token = Buffer.from(`${cfg.basicUsername}:${cfg.basicPassword}`).toString('base64')
        authHeaders.Authorization = `Basic ${token}`
      }
      else if (authType === 'custom') {
        if (cfg.customHeaders)
          Object.assign(authHeaders, cfg.customHeaders)
        if (cfg.customQuery) {
          for (const [k, v] of Object.entries(cfg.customQuery))
            authQuery.set(k, v as string)
        }
      }

      const authQueryString = authQuery.toString()
      let finalUrl = joinWithoutDuplicateSegments(baseUrl, path)
      if (authQueryString)
        finalUrl = finalUrl + (finalUrl.includes('?') ? '&' : '?') + authQueryString

      const response = await fetch(finalUrl, {
        ...preparedInit,
        method: preparedInit.method || 'GET',
        headers: {
          ...preparedInit.headers,
          ...authHeaders,
        },
      })

      if (!response.ok) {
        const contentType = response.headers.get('content-type') || ''
        let bodyText = ''
        try {
          bodyText = contentType.includes('json') ? JSON.stringify(await response.json()) : await response.text()
        }
        catch {}
        const redactedUrl = cfg.apiKey ? finalUrl.replace(cfg.apiKey, '***') : finalUrl
        throw new HttpError(response.status, 'Failed to proxy request to http integration.', {
          status: response.status,
          url: redactedUrl,
          contentType,
          body: bodyText?.slice(0, 4000),
        })
      }
      return response
    }

    const usesCredentials = integration.connectionMethod === 'credentials'
    if (usesCredentials) {
      if (!this.opts.credentialStore)
        throw new HttpError(500, 'Credential storage is not configured.')

      const spaceId = integration.spaceId
      if (!spaceId)
        throw new HttpError(400, 'spaceId is required for credentials-based integrations.')

      const credentialId = integration.credentialId
      if (!credentialId)
        throw new HttpError(400, 'credentialId is required for credentials-based integrations.')

      const credCfg = loadIntegrationCredentialConfig(provider)
      if (!credCfg)
        throw new HttpError(501, `Provider '${provider}' does not support credentials-based auth yet.`)

      const creds = await this.opts.credentialStore.getCredentials(spaceId, credentialId)
      if (!creds)
        throw new HttpError(400, 'No credentials are configured for this integration.')

      if (provider.startsWith('google-')) {
        const maybeToken = (creds as any).token
        const serviceAccountJson = (creds as any).serviceAccountJson

        if (!maybeToken && !serviceAccountJson) {
          throw new HttpError(
            400,
            `Google integration '${provider}' requires either a 'token' or 'serviceAccountJson' credential.`,
          )
        }

        if (!maybeToken && serviceAccountJson) {
          const subject = typeof (creds as any).subject === 'string' ? (creds as any).subject : undefined

          const rawScopes = (creds as any).scopes
          const scopesFromCreds = Array.isArray(rawScopes)
            ? rawScopes.map((s: any) => String(s)).filter(Boolean)
            : (typeof rawScopes === 'string'
                ? rawScopes.split(/[,\s]+/g).map(s => s.trim()).filter(Boolean)
                : [])

          const defaultScopes: Record<string, string[]> = {
            'google-sheet': ['https://www.googleapis.com/auth/spreadsheets'],
            'google-docs': ['https://www.googleapis.com/auth/documents', 'https://www.googleapis.com/auth/drive'],
            'google-slides': ['https://www.googleapis.com/auth/presentations', 'https://www.googleapis.com/auth/drive'],
            'google-calendar': ['https://www.googleapis.com/auth/calendar'],
            'google-drive': ['https://www.googleapis.com/auth/drive'],
          }
          const scopes = scopesFromCreds.length ? scopesFromCreds : (defaultScopes[provider] || [])
          if (!scopes.length)
            throw new HttpError(400, `Missing OAuth scopes for Google integration '${provider}'.`)

          const token = await getGoogleAccessToken({ serviceAccountJson, scopes, subject })
          ;(creds as any).token = token
        }
      }

      const resolveTemplate = (template: string): string => {
        return String(template).replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, key) => {
          const v = (creds as any)[key]
          if (v === undefined || v === null)
            throw new HttpError(400, `Missing credential field '${key}'.`)
          return String(v)
        })
      }

      const resolvedHeaders: Record<string, string> = {}
      const resolvedQuery = new URLSearchParams()

      for (const [k, v] of Object.entries(credCfg.injection?.headers || {}))
        resolvedHeaders[k] = resolveTemplate(v as any)

      for (const [k, v] of Object.entries(credCfg.injection?.query || {}))
        resolvedQuery.set(k, resolveTemplate(v as any))

      const providerCfg = PROVIDERS[provider]
      if (!providerCfg)
        throw new HttpError(501, `Provider '${provider}' is not configured in the server proxy.`)

      const baseUrl = typeof providerCfg.baseUrl === 'function' ? providerCfg.baseUrl(/* todo */) : providerCfg.baseUrl
      let finalUrl = joinWithoutDuplicateSegments(baseUrl, path)

      const queryString = resolvedQuery.toString()
      if (queryString)
        finalUrl = finalUrl + (finalUrl.includes('?') ? '&' : '?') + queryString

      const preparedInit: RequestInit = { ...init }
      if (preparedInit.body !== undefined && typeof preparedInit.body !== 'string') {
        preparedInit.body = JSON.stringify(preparedInit.body)
        preparedInit.headers = {
          'Content-Type': 'application/json',
          ...preparedInit.headers,
        }
      }

      const redact = (s: string): string => {
        let out = s
        for (const val of Object.values(creds)) {
          if (typeof val === 'string' && val.length)
            out = out.split(val).join('***')
        }
        return out
      }

      const response = await fetch(finalUrl, {
        ...preparedInit,
        method: preparedInit.method || 'GET',
        headers: {
          ...preparedInit.headers,
          ...resolvedHeaders,
        },
      })
      if (!response.ok) {
        const contentType = response.headers.get('content-type') || ''
        let bodyText = ''
        try {
          bodyText = contentType.includes('json') ? JSON.stringify(await response.json()) : await response.text()
        }
        catch {}
        throw new HttpError(response.status, `Failed to proxy request to ${provider}.`, {
          status: response.status,
          url: redact(finalUrl),
          contentType,
          body: bodyText?.slice(0, 4000),
        })
      }
      return response
    }

    // Managed OAuth branch: used by hosted deployments / CI.
    if (!connectionId)
      throw new HttpError(400, 'connectionId is required for non-http providers.')
    if (!this.opts.managedOAuthBaseUrl || !this.opts.managedOAuthSecretKey)
      throw new HttpError(501, 'Managed OAuth is not configured for this server.')

    let managedConnection: any
    try {
      const managedUrl = `${this.opts.managedOAuthBaseUrl}/connection/${encodeURIComponent(connectionId)}?provider_config_key=${encodeURIComponent(provider)}`
      const resp = await fetch(managedUrl, {
        headers: { Authorization: `Bearer ${this.opts.managedOAuthSecretKey}` },
      })
      if (!resp.ok)
        throw new Error(`Managed OAuth connection lookup failed (${resp.status})`)
      managedConnection = await resp.json()
    }
    catch (error) {
      console.error('Failed to fetch connection details from managed OAuth gateway:', error)
      throw new HttpError(502, 'Failed to retrieve connection details from managed OAuth gateway.')
    }

    const providerId = provider
    const providerCfg = PROVIDERS[providerId]
    const creds = managedConnection.credentials || {}
    const userAccessToken = creds.access_token || creds.oauth_token || creds.token

    if (!providerCfg)
      throw new HttpError(501, `Provider '${providerId}' is not configured in the server proxy.`)

    const baseUrl = typeof providerCfg.baseUrl === 'function' ? providerCfg.baseUrl(/* todo */) : providerCfg.baseUrl
    const finalUrl = joinWithoutDuplicateSegments(baseUrl, path)

    try {
      const preparedInit: RequestInit = { ...init }

      if (preparedInit.body !== undefined && typeof preparedInit.body !== 'string') {
        preparedInit.body = JSON.stringify(preparedInit.body)
        preparedInit.headers = {
          'Content-Type': 'application/json',
          ...preparedInit.headers,
        }
      }

      if (providerId === 'trello') {
        if (!this.opts.trelloApiKey)
          throw new HttpError(500, 'Trello API key is not configured.')

        const queryParams = new URLSearchParams({
          ...providerCfg.makeAuth(userAccessToken, this.opts.trelloApiKey),
        }).toString()

        const urlWithAuth = finalUrl + (finalUrl.includes('?') ? '&' : '?') + queryParams
        const response = await fetch(urlWithAuth, { ...preparedInit, method: preparedInit.method || 'GET' })
        if (!response.ok) {
          const contentType = response.headers.get('content-type') || ''
          let bodyText = ''
          try {
            bodyText = contentType.includes('json') ? JSON.stringify(await response.json()) : await response.text()
          }
          catch {}
          throw new HttpError(response.status, `Failed to proxy request to ${providerId}.`, {
            status: response.status,
            url: urlWithAuth,
            contentType,
            body: bodyText?.slice(0, 4000),
          })
        }
        return response
      }

      const response = await fetch(finalUrl, {
        ...preparedInit,
        method: preparedInit.method || 'GET',
        headers: {
          ...preparedInit.headers,
          ...providerCfg.makeAuth(userAccessToken),
        },
      })
      if (!response.ok) {
        const contentType = response.headers.get('content-type') || ''
        let bodyText = ''
        try {
          bodyText = contentType.includes('json') ? JSON.stringify(await response.json()) : await response.text()
        }
        catch {}
        throw new HttpError(response.status, `Failed to proxy request to ${providerId}.`, {
          status: response.status,
          url: finalUrl,
          contentType,
          body: bodyText?.slice(0, 4000),
        })
      }
      return response
    }
    catch (error: any) {
      console.error(`Error proxying request to ${providerId}:`, error)
      if (error && typeof error === 'object' && 'statusCode' in error)
        throw error
      throw new HttpError(500, `Failed to proxy request to ${providerId}.`, (error as any)?.message)
    }
  }
}

