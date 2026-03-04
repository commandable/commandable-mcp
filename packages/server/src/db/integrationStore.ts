import { and, eq } from 'drizzle-orm'
import type { IntegrationData } from '../types.js'
import type { DbClient } from './client.js'
import { pgIntegrations, sqliteIntegrations } from './schema.js'

export async function listIntegrations(client: DbClient, spaceId?: string): Promise<IntegrationData[]> {
  const table: any = client.dialect === 'sqlite' ? sqliteIntegrations : pgIntegrations
  let query: any = (client.db as any).select().from(table)
  if (spaceId)
    query = query.where(eq(table.spaceId, spaceId))
  const rows = await query

  return rows.map((r: any) => {
    const cfg = client.dialect === 'sqlite'
      ? (r.configJson ? JSON.parse(r.configJson) : undefined)
      : (r.configJson ?? undefined)
    const enabledToolsets = r.enabledToolsets ? JSON.parse(r.enabledToolsets) : undefined
    const disabledTools = r.disabledTools ? JSON.parse(r.disabledTools) : undefined

    const createdAt = client.dialect === 'sqlite'
      ? (r.createdAt ? new Date(r.createdAt) : undefined)
      : (r.createdAt ?? undefined)

    void createdAt

    const healthCheckedAt = r.healthCheckedAt
      ? (r.healthCheckedAt instanceof Date ? r.healthCheckedAt : new Date(r.healthCheckedAt))
      : null

    const integ: IntegrationData = {
      id: r.id,
      spaceId: r.spaceId ?? undefined,
      type: r.type,
      referenceId: r.referenceId,
      label: r.label,
      enabled: r.enabled === 0 || r.enabled === '0' ? false : true,
      connectionMethod: r.connectionMethod ?? undefined,
      connectionId: r.connectionId ?? undefined,
      credentialId: r.credentialId ?? undefined,
      credentialVariant: r.credentialVariant ?? undefined,
      config: cfg,
      enabledToolsets,
      maxScope: (r.maxScope as 'read' | 'write' | null) ?? undefined,
      disabledTools,
      healthStatus: (r.healthStatus as IntegrationData['healthStatus']) ?? null,
      healthCheckedAt,
    }
    return integ
  })
}

export async function upsertIntegration(client: DbClient, integration: IntegrationData): Promise<void> {
  const table: any = client.dialect === 'sqlite' ? sqliteIntegrations : pgIntegrations
  const now = new Date()
  const configValue = client.dialect === 'sqlite'
    ? (integration.config ? JSON.stringify(integration.config) : null)
    : (integration.config ?? null)
  const enabledToolsetsValue = integration.enabledToolsets ? JSON.stringify(integration.enabledToolsets) : null
  const disabledToolsValue = integration.disabledTools?.length ? JSON.stringify(integration.disabledTools) : null
  const enabledValue = client.dialect === 'sqlite'
    ? (integration.enabled === false ? 0 : 1)
    : (integration.enabled === false ? '0' : '1')

  await (client.db as any)
    .insert(table)
    .values({
      id: integration.id,
      spaceId: integration.spaceId ?? null,
      type: integration.type,
      referenceId: integration.referenceId,
      label: integration.label,
      enabled: enabledValue,
      connectionMethod: integration.connectionMethod ?? null,
      connectionId: integration.connectionId ?? null,
      credentialId: integration.credentialId ?? null,
      credentialVariant: integration.credentialVariant ?? null,
      configJson: configValue,
      enabledToolsets: enabledToolsetsValue,
      maxScope: integration.maxScope ?? null,
      disabledTools: disabledToolsValue,
      createdAt: client.dialect === 'sqlite' ? now : now,
    })
    .onConflictDoUpdate({
      target: table.id,
      set: {
        spaceId: integration.spaceId ?? null,
        type: integration.type,
        referenceId: integration.referenceId,
        label: integration.label,
        enabled: enabledValue,
        connectionMethod: integration.connectionMethod ?? null,
        connectionId: integration.connectionId ?? null,
        credentialId: integration.credentialId ?? null,
        credentialVariant: integration.credentialVariant ?? null,
        configJson: configValue,
        enabledToolsets: enabledToolsetsValue,
        maxScope: integration.maxScope ?? null,
        disabledTools: disabledToolsValue,
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
  const table: any = client.dialect === 'sqlite' ? sqliteIntegrations : pgIntegrations
  await (client.db as any)
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
  const table: any = client.dialect === 'sqlite' ? sqliteIntegrations : pgIntegrations
  const now = checkedAt ?? new Date()

  await (client.db as any)
    .update(table)
    .set({ healthStatus, healthCheckedAt: now })
    .where(and(eq(table.id, integrationId)))
}

