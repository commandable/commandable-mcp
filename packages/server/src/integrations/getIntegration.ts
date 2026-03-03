import type { IntegrationData } from '../types.js'
import type { IntegrationProxy } from './proxy.js'

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

    const isHttp = integration.type === 'http'
    const isCredentialsConnected = integration.connectionMethod === 'credentials' && !!integration.credentialId
    if (!isHttp && !integration.connectionId && !isCredentialsConnected)
      throw new Error((() => {
        const portRaw = process.env.COMMANDABLE_CREDENTIAL_PORT
        const port = portRaw && /^\d+$/.test(portRaw) ? Number(portRaw) : 23432
        const url = `http://127.0.0.1:${port}/credentials/${encodeURIComponent(integration.id)}`
        return `Integration is not connected. If this integration uses credentials, open ${url} to configure them.`
      })())

    const verbWithBody = (method: string) => (path: string, body: any, init: RequestInit = {}) =>
      proxy.call(integration, path, { ...init, method, body: JSON.stringify(body) })

    const verbNoBody = (method: string) => (path: string, init: RequestInit = {}) =>
      proxy.call(integration, path, { ...init, method })

    return {
      fetch: (path: string, init?: RequestInit) => proxy.call(integration, path, init),
      get: verbNoBody('GET'),
      post: verbWithBody('POST'),
      put: verbWithBody('PUT'),
      patch: verbWithBody('PATCH'),
      delete: verbNoBody('DELETE'),
    }
  }
}

