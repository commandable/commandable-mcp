import type { DbClient } from '../db/client.js'
import { upsertIntegration } from '../db/integrationStore.js'
import type { SqlCredentialStore } from '../db/credentialStore.js'
import type { IntegrationData } from '../types.js'
import type { CommandableConfig, IntegrationConfig } from './configSchema.js'

export type ApplyConfigResult = {
  spaceId: string
  integrationsUpserted: number
  credentialsWritten: number
  credentialsUnchanged: number
}

function stableSort(value: any): any {
  if (Array.isArray(value))
    return value.map(stableSort)
  if (value && typeof value === 'object') {
    const out: any = {}
    for (const k of Object.keys(value).sort())
      out[k] = stableSort((value as any)[k])
    return out
  }
  return value
}

function stableJson(value: any): string {
  return JSON.stringify(stableSort(value))
}

function makeIntegrationId(it: IntegrationConfig): string {
  if (it.id && it.id.trim().length)
    return it.id.trim()
  const ref = (it.referenceId && it.referenceId.trim().length) ? it.referenceId.trim() : it.type
  if (ref !== it.type)
    return `${it.type}:${ref}`
  return it.type
}

function toIntegrationData(spaceId: string, it: IntegrationConfig): IntegrationData {
  const referenceId = (it.referenceId && it.referenceId.trim().length) ? it.referenceId.trim() : it.type
  const label = (it.label && it.label.trim().length) ? it.label.trim() : referenceId
  const credentialId = (it.credentialId && it.credentialId.trim().length) ? it.credentialId.trim() : `${referenceId}-creds`

  return {
    spaceId: (it.spaceId && it.spaceId.trim().length) ? it.spaceId.trim() : spaceId,
    id: makeIntegrationId(it),
    type: it.type,
    referenceId,
    label,
    enabled: it.enabled ?? true,
    enabledToolsets: it.toolsets ?? undefined,
    maxScope: it.maxScope ?? undefined,
    disabledTools: it.disabledTools?.length ? it.disabledTools : undefined,
    connectionMethod: it.credentials ? 'credentials' : undefined,
    connectionId: null,
    credentialId: it.credentials ? credentialId : (it.credentialId ?? undefined),
    credentialVariant: (it.credentialVariant && it.credentialVariant.trim().length) ? it.credentialVariant.trim() : undefined,
  }
}

export async function applyConfig(params: {
  config: CommandableConfig
  db: DbClient
  credentialStore: SqlCredentialStore
  defaultSpaceId?: string
}): Promise<ApplyConfigResult> {
  const spaceId = params.config.spaceId || params.defaultSpaceId || process.env.COMMANDABLE_SPACE_ID || 'local'

  let integrationsUpserted = 0
  let credentialsWritten = 0
  let credentialsUnchanged = 0

  for (const it of params.config.integrations || []) {
    const integration = toIntegrationData(spaceId, it)
    await upsertIntegration(params.db, integration)
    integrationsUpserted++

    if (!it.credentials || !integration.credentialId)
      continue

    const desired = it.credentials
    let existing: any = null
    try {
      existing = await params.credentialStore.getCredentials(integration.spaceId || spaceId, integration.credentialId)
    }
    catch {
      existing = null
    }

    if (existing && stableJson(existing) === stableJson(desired)) {
      credentialsUnchanged++
      continue
    }

    await params.credentialStore.saveCredentials(integration.spaceId || spaceId, integration.credentialId, desired as any)
    credentialsWritten++
  }

  return {
    spaceId,
    integrationsUpserted,
    credentialsWritten,
    credentialsUnchanged,
  }
}

