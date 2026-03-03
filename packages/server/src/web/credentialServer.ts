import http from 'node:http'
import type { AddressInfo } from 'node:net'
import { loadIntegrationHint, loadIntegrationVariants } from '../integrations/dataLoader.js'
import { listIntegrations, upsertIntegration } from '../db/integrationStore.js'
import type { DbClient } from '../db/client.js'
import type { SqlCredentialStore } from '../db/credentialStore.js'
import type { IntegrationData } from '../types.js'
import { renderCredentialPage } from './credentialPage.js'

function json(res: http.ServerResponse, status: number, body: any) {
  const text = JSON.stringify(body ?? {})
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.end(text)
}

function text(res: http.ServerResponse, status: number, body: string, contentType: string = 'text/plain; charset=utf-8') {
  res.statusCode = status
  res.setHeader('content-type', contentType)
  res.end(body)
}

async function readJson(req: http.IncomingMessage): Promise<any> {
  const chunks: Buffer[] = []
  for await (const c of req)
    chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c))
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw.trim())
    return null
  return JSON.parse(raw)
}

function parseCredentialPath(pathname: string): { integrationId: string } | null {
  const m = pathname.match(/^\/credentials\/([^/]+)$/)
  if (!m)
    return null
  return { integrationId: decodeURIComponent(m[1] || '') }
}

export type CredentialServerHandle = {
  baseUrl: string
  close: () => Promise<void>
}

export async function startCredentialServer(params: {
  host?: string
  port?: number
  spaceId: string
  db: DbClient
  credentialStore: SqlCredentialStore
  integrationsRef?: { current: IntegrationData[] }
}): Promise<CredentialServerHandle> {
  const host = params.host || '127.0.0.1'
  const port = params.port ?? 23432

  const server = http.createServer(async (req, res) => {
    try {
      const method = (req.method || 'GET').toUpperCase()
      const url = new URL(req.url || '/', `http://${host}:${port}`)

      if (url.pathname === '/health')
        return json(res, 200, { ok: true })

      const credRoute = parseCredentialPath(url.pathname)
      if (!credRoute)
        return text(res, 404, 'Not found')

      const integrations = await listIntegrations(params.db, params.spaceId)
      const integ = integrations.find(i => i.id === credRoute.integrationId)
      if (!integ)
        return text(res, 404, 'Integration not found')

      const variantsFile = loadIntegrationVariants(integ.type)
      if (!variantsFile)
        return text(res, 400, 'This integration does not support credentials.')

      if (method === 'GET') {
        const variants = Object.entries(variantsFile.variants || {}).map(([key, v]) => ({
          key,
          label: v.label || key,
          schema: v.schema || {},
          hintMarkdown: (() => {
            try { return loadIntegrationHint(integ.type, key) } catch { return null }
          })(),
        }))

        const credentialId = integ.credentialId || `${integ.referenceId}-creds`
        let hasCredentials = false
        if (integ.connectionMethod === 'credentials' || !!integ.credentialId) {
          try { hasCredentials = await params.credentialStore.hasCredentials(params.spaceId, credentialId) } catch {}
        }

        const html = renderCredentialPage({
          integrationId: integ.id,
          integrationType: integ.type,
          integrationLabel: integ.label,
          variants,
          defaultVariantKey: integ.credentialVariant || variantsFile.default || null,
          hasCredentials,
          postUrl: `/credentials/${encodeURIComponent(integ.id)}`,
        })
        return text(res, 200, html, 'text/html; charset=utf-8')
      }

      if (method === 'POST') {
        const body = await readJson(req)
        if (!body || typeof body !== 'object')
          return json(res, 400, { ok: false, error: 'JSON body is required.' })

        const { credentialVariant, ...credentialValues } = body as any
        const variantKey = typeof credentialVariant === 'string' && credentialVariant.trim().length
          ? credentialVariant.trim()
          : (integ.credentialVariant || variantsFile.default || null)

        const credentialId = integ.credentialId || `${integ.referenceId}-creds`

        await params.credentialStore.saveCredentials(params.spaceId, credentialId, credentialValues || {})

        const updated: IntegrationData = {
          ...integ,
          spaceId: params.spaceId,
          connectionMethod: 'credentials',
          connectionId: null,
          credentialId,
          credentialVariant: variantKey,
        }

        await upsertIntegration(params.db, updated)

        if (params.integrationsRef) {
          try { params.integrationsRef.current = await listIntegrations(params.db, params.spaceId) } catch {}
        }

        return json(res, 200, { ok: true })
      }

      return text(res, 405, 'Method not allowed')
    }
    catch (err: any) {
      const msg = err?.message ? String(err.message) : String(err)
      return json(res, 500, { ok: false, error: msg })
    }
  })

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, host, () => resolve())
  })

  const addr = server.address() as AddressInfo
  const baseUrl = `http://${addr.address}:${addr.port}`

  return {
    baseUrl,
    close: async () => {
      await new Promise<void>((resolve) => server.close(() => resolve()))
    },
  }
}

