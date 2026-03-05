import { and, eq } from 'drizzle-orm'
import type { IntegrationData } from '../types.js'
import type { DbClient } from './client.js'
import { pgIntegrations, sqliteIntegrations } from './schema.js'

function t(client: DbClient) {
  return client.dialect === 'sqlite' ? sqliteIntegrations : pgIntegrations
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(client: DbClient): any {
  return client.db
}

function parseJson(raw: any): any {
  if (!raw)
    return undefined
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) } catch { return undefined }
  }
  return raw
}

export async function listIntegrations(client: DbClient, spaceId?: string): Promise<IntegrationData[]> {
  const table = t(client)
  let query: any = db(client).select().from(table)
  if (spaceId)
    query = query.where(eq(table.spaceId, spaceId))
  const rows: any[] = await query

  return rows.map((r) => {
    const healthCheckedAt = r.healthCheckedAt
      ? (r.healthCheckedAt instanceof Date ? r.healthCheckedAt : new Date(r.healthCheckedAt))
      : null

    return {
      id: r.id,
      spaceId: r.spaceId ?? undefined,
      type: r.type,
      referenceId: r.referenceId,
      label: r.label,
      enabled: r.enabled === 0 ? false : true,
      connectionMethod: r.connectionMethod ?? undefined,
      connectionId: r.connectionId ?? undefined,
      credentialId: r.credentialId ?? undefined,
      credentialVariant: r.credentialVariant ?? undefined,
      config: parseJson(r.configJson),
      enabledToolsets: parseJson(r.enabledToolsets),
      maxScope: (r.maxScope as 'read' | 'write' | null) ?? undefined,
      disabledTools: parseJson(r.disabledTools),
      healthStatus: (r.healthStatus as IntegrationData['healthStatus']) ?? null,
      healthCheckedAt,
    } satisfies IntegrationData
  })
}

export async function upsertIntegration(client: DbClient, integration: IntegrationData): Promise<void> {
  const table = t(client)
  const now = new Date()
  const enabled = integration.enabled === false ? 0 : 1

  await db(client)
    .insert(table)
    .values({
      id: integration.id,
      spaceId: integration.spaceId ?? null,
      type: integration.type,
      referenceId: integration.referenceId,
      label: integration.label,
      enabled,
      connectionMethod: integration.connectionMethod ?? null,
      connectionId: integration.connectionId ?? null,
      credentialId: integration.credentialId ?? null,
      credentialVariant: integration.credentialVariant ?? null,
      configJson: integration.config ? JSON.stringify(integration.config) : null,
      enabledToolsets: integration.enabledToolsets ? JSON.stringify(integration.enabledToolsets) : null,
      maxScope: integration.maxScope ?? null,
      disabledTools: integration.disabledTools?.length ? JSON.stringify(integration.disabledTools) : null,
      createdAt: now,
    })
    .onConflictDoUpdate({
      target: table.id,
      set: {
        spaceId: integration.spaceId ?? null,
        type: integration.type,
        referenceId: integration.referenceId,
        label: integration.label,
        enabled,
        connectionMethod: integration.connectionMethod ?? null,
        connectionId: integration.connectionId ?? null,
        credentialId: integration.credentialId ?? null,
        credentialVariant: integration.credentialVariant ?? null,
        configJson: integration.config ? JSON.stringify(integration.config) : null,
        enabledToolsets: integration.enabledToolsets ? JSON.stringify(integration.enabledToolsets) : null,
        maxScope: integration.maxScope ?? null,
        disabledTools: integration.disabledTools?.length ? JSON.stringify(integration.disabledTools) : null,
      },
    })
}

/** Update only credential linkage fields — does not clobber toolsets/permissions. */
export async function updateIntegrationCredentials(
  client: DbClient,
  integrationId: string,
  fields: {
    connectionMethod: 'credentials' | null
    credentialId: string | null
    credentialVariant: string | null
  },
): Promise<void> {
  const table = t(client)
  await db(client)
    .update(table)
    .set({
      connectionMethod: fields.connectionMethod ?? null,
      credentialId: fields.credentialId ?? null,
      credentialVariant: fields.credentialVariant ?? null,
    })
    .where(eq(table.id, integrationId))
}

export async function updateIntegrationHealth(
  client: DbClient,
  integrationId: string,
  healthStatus: 'disconnected' | 'connected' | 'invalid_credentials',
  checkedAt?: Date,
): Promise<void> {
  const table = t(client)
  await db(client)
    .update(table)
    .set({ healthStatus, healthCheckedAt: checkedAt ?? new Date() })
    .where(and(eq(table.id, integrationId)))
}
