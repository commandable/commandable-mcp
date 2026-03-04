import type { IntegrationData } from '../types.js'
import type { IntegrationProxy } from './proxy.js'
import { loadIntegrationCredentialConfig } from './dataLoader.js'

export type HealthStatus = 'disconnected' | 'connected' | 'invalid_credentials'

export interface HealthResult {
  status: HealthStatus
  /**
   * true when the provider has no `healthCheck` endpoint defined in its
   * credentials.json — no network call was made, so we cannot confirm validity.
   */
  skipped?: boolean
  checkedAt: Date
  message?: string
}

export async function checkIntegrationHealth(params: {
  integration: IntegrationData
  proxy: IntegrationProxy
}): Promise<HealthResult> {
  const { integration, proxy } = params
  const checkedAt = new Date()

  // Load the health check path from the integration-data credentials config
  const credCfg = loadIntegrationCredentialConfig(integration.type, integration.credentialVariant)
  const healthCheck = credCfg?.healthCheck

  if (!healthCheck?.path) {
    // No health endpoint defined for this provider/variant — skip
    return { status: 'connected', skipped: true, checkedAt }
  }

  const method = healthCheck.method ?? 'GET'

  try {
    await proxy.call(integration, healthCheck.path, { method })
    return { status: 'connected', checkedAt }
  }
  catch (err: any) {
    // Missing credentials — proxy throws before making the HTTP call
    if (err?.statusCode === 400 && err?.message?.includes('No credentials')) {
      return { status: 'disconnected', checkedAt, message: err.message }
    }
    if (err?.statusCode === 400 && err?.message?.includes('credentialId')) {
      return { status: 'disconnected', checkedAt, message: err.message }
    }

    const statusCode = err?.statusCode ?? null
    if (statusCode === 401) {
      return { status: 'invalid_credentials', checkedAt, message: err.message }
    }
    // 403 can mean bad creds or missing scopes — treat as invalid to prompt reconfiguration
    if (statusCode === 403) {
      return { status: 'invalid_credentials', checkedAt, message: err.message }
    }

    // Network errors, 5xx, transient failures — don't flip to invalid; skip so we
    // don't wrongly mark a healthy integration as broken due to transient issues.
    return { status: 'connected', skipped: true, checkedAt, message: String(err?.message ?? err) }
  }
}
