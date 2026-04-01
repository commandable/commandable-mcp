import { Buffer } from 'node:buffer'
import { HttpError } from '../errors/httpError.js'
import type { IntegrationCredentialVariant, IntegrationData, IntegrationTypeConfig } from '../types.js'
import { getBuiltInIntegrationTypeConfig } from './fileIntegrationTypeConfigStore.js'
import { getGoogleAccessToken } from './googleServiceAccount.js'

export interface CredentialStore {
  getCredentials: (spaceId: string, credentialId: string) => Promise<Record<string, string> | null>
}

export interface IntegrationProxyOptions {
  credentialStore?: CredentialStore
  integrationTypeConfigsRef?: { current: IntegrationTypeConfig[] }
}

function getErrorHint(status: number, provider: string, bodyText: string): string {
  const isGoogle = provider.startsWith('google-')
  if (status === 401) {
    if (isGoogle)
      return 'Authentication failed. Check that the credential token is valid and not expired. For service accounts, verify the service account has been granted access to the resource.'
    return 'Authentication failed. Check that the credential is valid and not expired.'
  }
  if (status === 403) {
    if (isGoogle)
      return 'Permission denied. The credential does not have sufficient scopes or access to this resource. Ensure the required API scopes are enabled and the service account has been shared access to the resource.'
    return 'Permission denied. The credential does not have sufficient scopes or access to this resource.'
  }
  if (status === 404) {
    if (isGoogle)
      return 'Resource not found. The ID may be invalid or the resource may have been deleted. Use the appropriate list or search tool to find valid IDs. For Google Drive, ensure the service account has been granted access to the file or folder.'
    return 'Resource not found. Verify the ID is correct and the resource exists.'
  }
  if (status === 409)
    return 'Conflict. The resource already exists or there is a version conflict. Try fetching the current state before retrying.'
  if (status === 429)
    return 'Rate limit exceeded. The API quota has been reached. Wait a moment before retrying the request.'
  if (status === 400) {
    if (bodyText.includes('invalidQuery') || bodyText.includes('Invalid query'))
      return 'Invalid query syntax. Check the query parameter format for this API.'
    if (bodyText.includes('Invalid value') || bodyText.includes('invalid value'))
      return 'A parameter value is invalid. Check enum values, required fields, and data formats (e.g. RFC3339 for dates).'
    if (bodyText.includes('required'))
      return 'A required parameter is missing. Check that all required fields are provided.'
    return 'Bad request. Check that all required parameters are provided, values are in the correct format, and the request body matches the expected schema.'
  }
  if (status === 500 || status === 503)
    return 'The upstream API returned a server error. This is likely a temporary issue -- retry the request after a short delay.'
  return ''
}

function buildCredentialUrl(integrationId: string): string {
  const portRaw = process.env.COMMANDABLE_UI_PORT
  const port = portRaw && /^\d+$/.test(portRaw) ? Number(portRaw) : 23432
  return `http://127.0.0.1:${port}/integrations/${encodeURIComponent(integrationId)}`
}

function isAbsoluteHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  }
  catch {
    return false
  }
}

/** Prevents credential-bearing requests to arbitrary origins (SSRF-style token exfiltration). */
function assertAbsoluteUrlMatchesBaseOrigin(absolutePath: string, baseUrl: string): void {
  let baseOrigin: string
  try {
    baseOrigin = new URL(baseUrl).origin
  }
  catch {
    throw new HttpError(400, 'Invalid integration base URL.')
  }
  let requestOrigin: string
  try {
    requestOrigin = new URL(absolutePath).origin
  }
  catch {
    throw new HttpError(400, 'Invalid absolute request URL.')
  }
  if (requestOrigin !== baseOrigin) {
    throw new HttpError(
      400,
      `Absolute request URL origin must match the integration API origin (${baseOrigin}).`,
    )
  }
}

export class IntegrationProxy {
  constructor(private readonly opts: IntegrationProxyOptions = {}) {}

  async call(integration: IntegrationData, path: string, init: RequestInit = {}): Promise<Response> {
    const { type: provider } = integration

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

      // Resolve integration type config — file-backed built-ins first, then in-memory DB cache.
      const fileTypeCfg = getBuiltInIntegrationTypeConfig(provider)
      const typeCfg: IntegrationTypeConfig | null = fileTypeCfg
        ?? (this.opts.integrationTypeConfigsRef?.current.find(
          c => c.spaceId === spaceId && c.typeSlug === provider) ?? null)
      if (!typeCfg)
        throw new HttpError(501, `Provider '${provider}' does not support credentials-based auth yet.`)

      const variantKey = integration.credentialVariant || typeCfg.defaultVariant
      const variant: IntegrationCredentialVariant | undefined = typeCfg.variants[variantKey]
        ?? typeCfg.variants[typeCfg.defaultVariant]
      if (!variant)
        throw new HttpError(501, `Variant '${variantKey}' not found for provider '${provider}'.`)

      const creds = await this.opts.credentialStore.getCredentials(spaceId, credentialId)
      if (!creds) {
        const credentialUrl = buildCredentialUrl(integration.id)
        throw new HttpError(400, `No credentials are configured for this integration. Open ${credentialUrl} to configure them.`, {
          reason: 'missing_credentials',
          credential_url: credentialUrl,
        })
      }

      const resolveTemplate = (template: string): string => {
        return String(template).replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_m: string, expr: string) => {
          const trimmed = expr.trim()
          // base64(...) transform: supports field refs and string literals joined with +
          // e.g. {{base64(email + ":" + apiToken)}}
          const base64Match = trimmed.match(/^base64\((.+)\)$/)
          if (base64Match) {
            const base64Expr = base64Match[1]
            if (base64Expr === undefined)
              throw new HttpError(400, `Invalid base64 template expression '${trimmed}'.`)
            const parts = base64Expr.split(/\s*\+\s*/)
            const resolved = parts.map(part => {
              const p = part.trim()
              if ((p.startsWith('"') && p.endsWith('"')) || (p.startsWith("'") && p.endsWith("'")))
                return p.slice(1, -1)
              const v = (creds as any)[p]
              if (v === undefined || v === null)
                throw new HttpError(400, `Missing credential field '${p}'.`)
              return String(v)
            }).join('')
            return Buffer.from(resolved).toString('base64')
          }
          // Simple field reference
          const v = (creds as any)[trimmed]
          if (v === undefined || v === null)
            throw new HttpError(400, `Missing credential field '${trimmed}'.`)
          return String(v)
        })
      }

      const baseUrl = (() => {
        if (variant.baseUrlTemplate)
          return resolveTemplate(variant.baseUrlTemplate)
        if (variant.baseUrl)
          return variant.baseUrl
        throw new HttpError(501, `No base URL configured for provider '${provider}'.`)
      })()

      const typeConfig = { baseUrl, auth: variant.auth, preprocess: variant.preprocess ?? null }

      // Preprocess steps (e.g. service account token exchange, Basic Auth encoding).
      if (typeConfig.preprocess === 'google_service_account') {
        const serviceAccountJson = (creds as any).serviceAccountJson
        if (!serviceAccountJson)
          throw new HttpError(400, `Integration '${provider}' requires a 'serviceAccountJson' credential for the service_account variant.`)

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
          'google-gmail': ['https://mail.google.com/'],
        }
        const scopes = scopesFromCreds.length ? scopesFromCreds : (defaultScopes[provider] || [])
        if (!scopes.length)
          throw new HttpError(400, `Missing OAuth scopes for Google integration '${provider}'.`)

        const token = await getGoogleAccessToken({ serviceAccountJson, scopes, subject })
        ;(creds as any).token = token
      }

      const resolvedHeaders: Record<string, string> = {}
      const resolvedQuery = new URLSearchParams()

      if (typeConfig.auth.kind === 'basic') {
        const username = (creds as any)[typeConfig.auth.usernameField]
        const password = (creds as any)[typeConfig.auth.passwordField]
        if (username == null || password == null) {
          throw new HttpError(
            400,
            `Missing credential fields for basic auth: '${typeConfig.auth.usernameField}' and/or '${typeConfig.auth.passwordField}'.`,
          )
        }
        const token = Buffer.from(`${username}:${password}`).toString('base64')
        resolvedHeaders.Authorization = `Basic ${token}`
      }
      else {
        for (const [k, v] of Object.entries(typeConfig.auth.injection?.headers || {}))
          resolvedHeaders[k] = resolveTemplate(v as any)
        for (const [k, v] of Object.entries(typeConfig.auth.injection?.query || {}))
          resolvedQuery.set(k, resolveTemplate(v as any))
      }

      let finalUrl: string
      if (isAbsoluteHttpUrl(path)) {
        assertAbsoluteUrlMatchesBaseOrigin(path, typeConfig.baseUrl)
        finalUrl = path
      }
      else {
        finalUrl = joinWithoutDuplicateSegments(typeConfig.baseUrl, path)
      }

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
        const hint = getErrorHint(response.status, provider, bodyText)
        const hintSuffix = hint ? ` ${hint}` : ''
        const credentialUrl = buildCredentialUrl(integration.id)
        const hintWithUrl = response.status === 401
          ? `${hint} Open ${credentialUrl} to reconfigure.`
          : hint
        const hintWithUrlSuffix = hintWithUrl ? ` ${hintWithUrl}` : ''
        throw new HttpError(response.status, `Failed to proxy request to ${provider} (${response.status})${bodyText ? `: ${bodyText.slice(0, 500)}` : ''}.${response.status === 401 ? hintWithUrlSuffix : hintSuffix}`, {
          status: response.status,
          url: redact(finalUrl),
          contentType,
          body: bodyText?.slice(0, 4000),
          ...(response.status === 401 ? { reason: 'invalid_credentials', credential_url: credentialUrl } : {}),
        })
      }
      return response
    }

    throw new HttpError(501, 'Only credentials-based integrations are supported. Managed OAuth is not configured.')
  }
}

