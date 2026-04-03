import type { IntegrationData } from '../types.js'
import type { IntegrationProxy } from './proxy.js'
import { HttpError } from '../errors/httpError.js'

export type IntegrationListRef = { current: IntegrationData[] }

export function createGetIntegration(
  integrations: IntegrationData[] | IntegrationListRef | undefined,
  proxy: IntegrationProxy,
) {
  return (refOrId: string) => {
    const list = Array.isArray(integrations) ? integrations : integrations?.current
    const integration = list?.find(i => i.id === refOrId || (i as any).referenceId === refOrId)
    if (!integration)
      throw new Error('Invalid or unauthorized integration reference/id')

    const isCredentialsConnected = integration.connectionMethod === 'credentials' && !!integration.credentialId
    if (!integration.connectionId && !isCredentialsConnected) {
      const portRaw = process.env.COMMANDABLE_UI_PORT
      const port = portRaw && /^\d+$/.test(portRaw) ? Number(portRaw) : 23432
      const credentialUrl = `http://127.0.0.1:${port}/integrations/${encodeURIComponent(integration.id)}`
      throw new HttpError(400, `Integration is not connected. Open ${credentialUrl} to configure credentials.`, {
        reason: 'missing_credentials',
        credential_url: credentialUrl,
      })
    }

    const verbWithBody = (method: string) => (path: string, body: any, init: RequestInit = {}) =>
      proxy.call(integration, path, { ...init, method, body: JSON.stringify(body) })

    const verbNoBody = (method: string) => (path: string, init: RequestInit = {}) =>
      proxy.call(integration, path, { ...init, method })

    return {
      referenceId: integration.referenceId,
      type: integration.type,
      label: integration.label,
      fetch: (path: string, init?: RequestInit) => proxy.call(integration, path, init),
      get: verbNoBody('GET'),
      post: verbWithBody('POST'),
      put: verbWithBody('PUT'),
      patch: verbWithBody('PATCH'),
      delete: verbNoBody('DELETE'),
    }
  }
}

