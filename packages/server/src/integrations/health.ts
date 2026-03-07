import type { DbClient } from '../db/client.js'
import type { IntegrationData } from '../types.js'
import type { IntegrationProxy } from './proxy.js'
import { getIntegrationTypeConfig } from '../db/integrationTypeConfigStore.js'
import { getBuiltInIntegrationTypeConfig } from './fileIntegrationTypeConfigStore.js'

export type HealthStatus = 'disconnected' | 'connected' | 'invalid_credentials'

export interface HealthResult {
  status: HealthStatus
  /**
   * true when the integration type has no healthCheck endpoint defined — no
   * network call was made, so we cannot confirm credential validity.
   */
  skipped?: boolean
  checkedAt: Date
  message?: string
}

export async function checkIntegrationHealth(params: {
  integration: IntegrationData
  proxy: IntegrationProxy
  db?: DbClient
}): Promise<HealthResult> {
  const { integration, proxy, db } = params
  const checkedAt = new Date()

  // Try file-based lookup first (sync, no DB needed), then fall back to DB for custom integrations.
  const typeCfg = getBuiltInIntegrationTypeConfig(integration.type)
    ?? (db && integration.spaceId
      ? await getIntegrationTypeConfig(db, integration.spaceId, integration.type)
      : null)

  const variantKey = integration.credentialVariant || typeCfg?.defaultVariant || null
  const variant = variantKey ? typeCfg?.variants[variantKey] : null
  const path = variant?.healthCheck?.path ?? null
  const method = variant?.healthCheck?.method ?? 'GET'

  if (!path) {
    return { status: 'connected', skipped: true, checkedAt }
  }

  try {
    await proxy.call(integration, path, { method })
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
