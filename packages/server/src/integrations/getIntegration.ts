import type { IntegrationData } from '../types.js'
import type { IntegrationProxy } from './proxy.js'

export function createGetIntegration(
  integrations: IntegrationData[] | undefined,
  proxy: IntegrationProxy,
) {
  return (refOrId: string) => {
    const integration = integrations?.find(i => i.id === refOrId || (i as any).referenceId === refOrId)
    if (!integration)
      throw new Error('Invalid or unauthorized integration reference/id')

    const isHttp = integration.type === 'http'
    const isCredentialsConnected = integration.connectionMethod === 'credentials' && !!integration.credentialId
    if (!isHttp && !integration.connectionId && !isCredentialsConnected)
      throw new Error('Integration is not connected')

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

