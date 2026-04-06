import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { HttpError } from '../errors/httpError.js'
import type { IntegrationCredentialVariant, IntegrationData, IntegrationTypeConfig } from '../types.js'
import { getBuiltInIntegrationTypeConfig } from './fileIntegrationTypeConfigStore.js'
import { getGoogleAccessToken } from './googleServiceAccount.js'
import { createSafeHandlerFromString } from './sandbox.js'

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

/** Decode JWT payload for debug only (no verification). Never log the raw token. */
function decodeJwtPayloadForDebug(token: string): {
  aud?: unknown
  tid?: unknown
  appid?: unknown
  roles?: unknown
  scp?: unknown
  idtyp?: unknown
} | null {
  try {
    const parts = token.split('.')
    if (parts.length < 2 || !parts[1])
      return null
    let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4))
    b64 = b64 + pad
    const json = Buffer.from(b64, 'base64').toString('utf8')
    const payload = JSON.parse(json) as Record<string, unknown>
    return {
      aud: payload.aud,
      tid: payload.tid,
      appid: payload.appid,
      roles: payload.roles,
      scp: payload.scp,
      idtyp: payload.idtyp,
    }
  }
  catch {
    return null
  }
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
function matchesAllowedOriginPattern(requestUrl: URL, pattern: string): boolean {
  let allowedUrl: URL
  try {
    allowedUrl = new URL(pattern)
  }
  catch {
    return false
  }

  if (allowedUrl.protocol !== requestUrl.protocol)
    return false

  if (allowedUrl.port !== requestUrl.port)
    return false

  if (allowedUrl.hostname.startsWith('*.')) {
    const suffix = allowedUrl.hostname.slice(2)
    return requestUrl.hostname === suffix || requestUrl.hostname.endsWith(`.${suffix}`)
  }

  return allowedUrl.origin === requestUrl.origin
}

function defaultAllowedOriginsForProvider(provider: string): string[] {
  if (provider === 'google-workspace')
    return ['https://*.googleapis.com']
  return []
}

function assertAbsoluteUrlIsAllowed(
  absolutePath: string,
  baseUrl: string,
  allowedOrigins: string[] = [],
): void {
  let baseOrigin: string
  try {
    baseOrigin = new URL(baseUrl).origin
  }
  catch {
    throw new HttpError(400, 'Invalid integration base URL.')
  }

  let requestUrl: URL
  try {
    requestUrl = new URL(absolutePath)
  }
  catch {
    throw new HttpError(400, 'Invalid absolute request URL.')
  }

  const allowed = requestUrl.origin === baseOrigin
    || allowedOrigins.some(pattern => matchesAllowedOriginPattern(requestUrl, pattern))

  if (!allowed) {
    throw new HttpError(
      400,
      `Absolute request URL origin must match the integration API origin (${baseOrigin}) or a configured allowed origin.`,
    )
  }
}

function resolveRelativeBaseUrl(provider: string, baseUrl: string, rawPath: string): string {
  if (provider !== 'google-workspace')
    return baseUrl

  const pathOnly = String(rawPath || '').split('?', 1)[0] || ''
  if (pathOnly === '/documents' || pathOnly.startsWith('/documents/'))
    return 'https://docs.googleapis.com/v1'
  if (pathOnly === '/spreadsheets' || pathOnly.startsWith('/spreadsheets/'))
    return 'https://sheets.googleapis.com/v4'
  if (pathOnly === '/presentations' || pathOnly.startsWith('/presentations/'))
    return 'https://slides.googleapis.com/v1'

  return baseUrl
}

function joinWithoutDuplicateSegments(baseUrl: string, rawPath: string): string {
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

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object')
    return JSON.stringify(value)
  if (Array.isArray(value))
    return `[${value.map(stableStringify).join(',')}]`

  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, innerValue]) => `${JSON.stringify(key)}:${stableStringify(innerValue)}`)
  return `{${entries.join(',')}}`
}

type CachedPreprocessResult = {
  data: Record<string, unknown>
  expiresAtMs: number
}

type HandlerCredentialPreprocess = {
  type: 'handler'
  handlerCode: string
  allowedOrigins?: string[] | null
}

const preprocessResultCache = new Map<string, CachedPreprocessResult>()

function isHandlerCredentialPreprocess(preprocess: unknown): preprocess is HandlerCredentialPreprocess {
  return typeof preprocess === 'object'
    && preprocess !== null
    && (preprocess as any).type === 'handler'
    && typeof (preprocess as any).handlerCode === 'string'
}

function getPreprocessCacheKey(provider: string, variantKey: string, creds: Record<string, unknown>): string {
  return createHash('sha256')
    .update(`${provider}:${variantKey}:${stableStringify(creds)}`)
    .digest('hex')
}

function getExpiresAtMs(result: Record<string, unknown>, now: number): number {
  const rawExpiresIn = result.expiresIn ?? result.expires_in
  const expiresIn = typeof rawExpiresIn === 'number'
    ? rawExpiresIn
    : (typeof rawExpiresIn === 'string' && rawExpiresIn.trim() ? Number(rawExpiresIn) : NaN)
  if (Number.isFinite(expiresIn) && expiresIn > 0)
    return now + (expiresIn * 1000)
  return now + (55 * 60_000)
}

function normalizeRequestInit(init: RequestInit = {}): RequestInit {
  const preparedInit: RequestInit = { ...init }
  if (preparedInit.body !== undefined
    && typeof preparedInit.body !== 'string'
    && !(preparedInit.body instanceof URLSearchParams)
    && !(preparedInit.body instanceof FormData)
    && !(preparedInit.body instanceof Blob)
    && !(preparedInit.body instanceof ArrayBuffer)) {
    preparedInit.body = JSON.stringify(preparedInit.body)
    preparedInit.headers = {
      'Content-Type': 'application/json',
      ...preparedInit.headers,
    }
  }
  else if (preparedInit.body instanceof URLSearchParams) {
    preparedInit.body = preparedInit.body.toString()
    preparedInit.headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...preparedInit.headers,
    }
  }
  return preparedInit
}

async function runSandboxCredentialPreprocess(params: {
  provider: string
  variantKey: string
  preprocess: HandlerCredentialPreprocess
  creds: Record<string, unknown>
  baseUrl: string
  allowedOrigins: string[]
}): Promise<void> {
  const { provider, variantKey, preprocess, creds, baseUrl, allowedOrigins } = params
  const cacheKey = getPreprocessCacheKey(provider, variantKey, creds)
  const existing = preprocessResultCache.get(cacheKey)
  const now = Date.now()
  if (existing && existing.expiresAtMs - now > 60_000) {
    Object.assign(creds, existing.data)
    return
  }

  const tokenFetch = async (path: string, init: RequestInit = {}) => {
    let finalUrl: string
    if (isAbsoluteHttpUrl(path)) {
      assertAbsoluteUrlIsAllowed(path, baseUrl, allowedOrigins)
      finalUrl = path
    }
    else {
      finalUrl = joinWithoutDuplicateSegments(baseUrl, path)
    }

    const preparedInit = normalizeRequestInit(init)
    return await fetch(finalUrl, {
      ...preparedInit,
      method: preparedInit.method || 'GET',
    })
  }

  const wrapper = `async (input) => {\n  const __inner = ${preprocess.handlerCode};\n  return await __inner(input, utils)\n}`
  const safeHandler = createSafeHandlerFromString(wrapper, () => ({}), { tokenFetch })
  const res = await safeHandler(creds)
  if (!res.success)
    throw new HttpError(400, `Credential preprocess failed for '${provider}': ${String((res.result as any)?.message || res.result || 'Unknown error')}`)

  const result = res.result
  if (!result || typeof result !== 'object' || Array.isArray(result))
    throw new HttpError(400, `Credential preprocess for '${provider}' must return an object.`)
  if (typeof (result as any).token !== 'string' || !(result as any).token.trim())
    throw new HttpError(400, `Credential preprocess for '${provider}' must return a non-empty 'token' string.`)

  Object.assign(creds, result)
  preprocessResultCache.set(cacheKey, {
    data: { ...(result as Record<string, unknown>) },
    expiresAtMs: getExpiresAtMs(result as Record<string, unknown>, now),
  })

  // #region agent log
  if (provider === 'sharepoint') {
    const t = (result as Record<string, unknown>)?.token
    const tokenStr = typeof t === 'string' ? t : ''
    const claims = tokenStr ? decodeJwtPayloadForDebug(tokenStr) : null
    const roles = claims?.roles
    const rolesList = Array.isArray(roles) ? roles.map(r => String(r).slice(0, 80)) : []
    fetch('http://127.0.0.1:7886/ingest/d4127044-8bb5-4b15-95f1-be96d51d67ea', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '797117' }, body: JSON.stringify({ sessionId: '797117', location: 'proxy.ts:runSandboxCredentialPreprocess', message: 'sharepoint preprocess ok', data: { variantKey, tokenLen: typeof t === 'string' ? t.length : 0, expiresIn: (result as Record<string, unknown>)?.expiresIn ?? (result as Record<string, unknown>)?.expires_in, tokenAud: claims?.aud, tokenTid: claims?.tid, tokenAppId: claims?.appid, tokenIdtyp: claims?.idtyp, rolesCount: rolesList.length, rolesSample: rolesList.slice(0, 12), hasScp: typeof claims?.scp === 'string' && String(claims.scp).length > 0, jwtDecodeOk: !!claims }, timestamp: Date.now(), hypothesisId: 'H6' }) }).catch(() => {})
  }
  // #endregion
}

export class IntegrationProxy {
  constructor(private readonly opts: IntegrationProxyOptions = {}) {}

  async call(integration: IntegrationData, path: string, init: RequestInit = {}): Promise<Response> {
    const { type: provider } = integration

    if (!provider || !path)
      throw new HttpError(400, 'provider and path are required.')

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

      const typeConfig = {
        baseUrl,
        allowedOrigins: [
          ...defaultAllowedOriginsForProvider(provider),
          ...(variant.allowedOrigins ?? []),
        ],
        auth: variant.auth,
        preprocess: variant.preprocess ?? null,
      }

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
          'google-workspace': [
            'https://www.googleapis.com/auth/drive',
            'https://www.googleapis.com/auth/documents',
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/presentations',
          ],
          'google-calendar': ['https://www.googleapis.com/auth/calendar'],
          'google-gmail': ['https://mail.google.com/'],
        }
        const scopes = scopesFromCreds.length ? scopesFromCreds : (defaultScopes[provider] || [])
        if (!scopes.length)
          throw new HttpError(400, `Missing OAuth scopes for Google integration '${provider}'.`)

        const token = await getGoogleAccessToken({ serviceAccountJson, scopes, subject })
        ;(creds as any).token = token
      }
      else if (isHandlerCredentialPreprocess(typeConfig.preprocess)) {
        await runSandboxCredentialPreprocess({
          provider,
          variantKey,
          preprocess: typeConfig.preprocess,
          creds: creds as Record<string, unknown>,
          baseUrl,
          allowedOrigins: [
            ...typeConfig.allowedOrigins,
            ...(typeConfig.preprocess.allowedOrigins ?? []),
          ],
        })
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
        assertAbsoluteUrlIsAllowed(path, typeConfig.baseUrl, typeConfig.allowedOrigins)
        finalUrl = path
      }
      else {
        finalUrl = joinWithoutDuplicateSegments(
          resolveRelativeBaseUrl(provider, typeConfig.baseUrl, path),
          path,
        )
      }

      const queryString = resolvedQuery.toString()
      if (queryString)
        finalUrl = finalUrl + (finalUrl.includes('?') ? '&' : '?') + queryString

      const preparedInit = normalizeRequestInit(init)

      const redact = (s: string): string => {
        let out = s
        for (const val of Object.values(creds)) {
          if (typeof val === 'string' && val.length)
            out = out.split(val).join('***')
        }
        return out
      }

      // #region agent log
      if (provider === 'sharepoint') {
        const auth = resolvedHeaders.Authorization
        const bodyString = typeof preparedInit.body === 'string' ? preparedInit.body : ''
        fetch('http://127.0.0.1:7886/ingest/d4127044-8bb5-4b15-95f1-be96d51d67ea', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '797117' }, body: JSON.stringify({ sessionId: '797117', location: 'proxy.ts:before-fetch', message: 'sharepoint outgoing', data: { method: preparedInit.method || 'GET', pathPreview: String(path).slice(0, 200), finalUrlHost: (() => { try { return new URL(finalUrl).host } catch { return 'invalid-url' } })(), hasAuthHeader: !!auth, authPrefix: auth ? String(auth).slice(0, 8) : '', tokenFieldLen: typeof (creds as any).token === 'string' ? (creds as any).token.length : 0, bodyPreview: bodyString.slice(0, 300), bodyHasRegion: bodyString.includes('"region"'), isSearchQuery: String(path).includes('/search/query'), isRegionLookup: String(path).includes('siteCollection/root ne null') }, timestamp: Date.now(), hypothesisId: String(path).includes('/search/query') || String(path).includes('siteCollection/root ne null') ? 'H9' : 'H1' }) }).catch(() => {})
      }
      // #endregion

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
        // #region agent log
        if (provider === 'sharepoint') {
          const auth = resolvedHeaders.Authorization
          let graphErrorCode = ''
          try {
            const parsed = JSON.parse(bodyText)
            graphErrorCode = String(parsed?.error?.code || parsed?.error || '')
          }
          catch {}
          fetch('http://127.0.0.1:7886/ingest/d4127044-8bb5-4b15-95f1-be96d51d67ea', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '797117' }, body: JSON.stringify({ sessionId: '797117', location: 'proxy.ts:graph-error', message: 'sharepoint graph non-ok', data: { status: response.status, pathPreview: String(path).slice(0, 160), finalUrlHost: (() => { try { return new URL(finalUrl).host } catch { return 'invalid-url' } })(), hasAuthHeader: !!auth, authPrefix: auth ? String(auth).slice(0, 8) : '', graphErrorCode: graphErrorCode.slice(0, 80), bodyPreview: bodyText.slice(0, 220) }, timestamp: Date.now(), hypothesisId: 'H2' }) }).catch(() => {})
        }
        // #endregion
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

