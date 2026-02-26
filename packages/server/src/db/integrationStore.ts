import { eq } from 'drizzle-orm'
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

    const createdAt = client.dialect === 'sqlite'
      ? (r.createdAt ? new Date(r.createdAt) : undefined)
      : (r.createdAt ?? undefined)

    void createdAt

    const integ: IntegrationData = {
      id: r.id,
      spaceId: r.spaceId ?? undefined,
      type: r.type,
      referenceId: r.referenceId,
      label: r.label,
      connectionMethod: r.connectionMethod ?? undefined,
      connectionId: r.connectionId ?? undefined,
      credentialId: r.credentialId ?? undefined,
      config: cfg,
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

  await (client.db as any)
    .insert(table)
    .values({
      id: integration.id,
      spaceId: integration.spaceId ?? null,
      type: integration.type,
      referenceId: integration.referenceId,
      label: integration.label,
      connectionMethod: integration.connectionMethod ?? null,
      connectionId: integration.connectionId ?? null,
      credentialId: integration.credentialId ?? null,
      configJson: configValue,
      createdAt: client.dialect === 'sqlite' ? now : now,
    })
    .onConflictDoUpdate({
      target: table.id,
      set: {
        spaceId: integration.spaceId ?? null,
        type: integration.type,
        referenceId: integration.referenceId,
        label: integration.label,
        connectionMethod: integration.connectionMethod ?? null,
        connectionId: integration.connectionId ?? null,
        credentialId: integration.credentialId ?? null,
        configJson: configValue,
      },
    })
}

