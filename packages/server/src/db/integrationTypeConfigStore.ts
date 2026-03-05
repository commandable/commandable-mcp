import { eq, and } from 'drizzle-orm'
import type { DbClient } from './client.js'
import { pgIntegrationTypeConfigs, sqliteIntegrationTypeConfigs } from './schema.js'
import type { IntegrationAuth, IntegrationTypeConfig } from '../types.js'

function parseJson(raw: any): any {
  if (raw == null)
    return null
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) } catch { return null }
  }
  return raw
}

function rowToIntegrationTypeConfig(client: DbClient, r: any): IntegrationTypeConfig {
  const createdAt = client.dialect === 'sqlite'
    ? (r.createdAt ? new Date(r.createdAt) : undefined)
    : (r.createdAt ?? undefined)
  const updatedAt = client.dialect === 'sqlite'
    ? (r.updatedAt ? new Date(r.updatedAt) : undefined)
    : (r.updatedAt ?? undefined)

  const auth = parseJson(r.authJson) as IntegrationAuth
  const credentialSchema = parseJson(r.credentialSchemaJson) || { type: 'object', additionalProperties: true }

  return {
    id: r.id,
    spaceId: r.spaceId,
    typeSlug: r.typeSlug,
    label: r.label,
    baseUrl: r.baseUrl,
    auth,
    credentialSchema,
    healthCheckPath: r.healthCheckPath ?? null,
    createdAt,
    updatedAt,
  }
}

export async function listIntegrationTypeConfigs(client: DbClient, spaceId: string): Promise<IntegrationTypeConfig[]> {
  const table: any = client.dialect === 'sqlite' ? sqliteIntegrationTypeConfigs : pgIntegrationTypeConfigs
  const rows = await (client.db as any)
    .select()
    .from(table)
    .where(eq(table.spaceId, spaceId))
  return rows.map((r: any) => rowToIntegrationTypeConfig(client, r))
}

export async function getIntegrationTypeConfig(
  client: DbClient,
  spaceId: string,
  typeSlug: string,
): Promise<IntegrationTypeConfig | null> {
  const table: any = client.dialect === 'sqlite' ? sqliteIntegrationTypeConfigs : pgIntegrationTypeConfigs
  const rows = await (client.db as any)
    .select()
    .from(table)
    .where(and(eq(table.spaceId, spaceId), eq(table.typeSlug, typeSlug)))
    .limit(1)
  return rows?.[0] ? rowToIntegrationTypeConfig(client, rows[0]) : null
}

export async function upsertIntegrationTypeConfig(
  client: DbClient,
  cfg: Required<Pick<IntegrationTypeConfig, 'id' | 'spaceId'>> & Omit<IntegrationTypeConfig, 'createdAt' | 'updatedAt'>,
): Promise<void> {
  const table: any = client.dialect === 'sqlite' ? sqliteIntegrationTypeConfigs : pgIntegrationTypeConfigs
  const now = new Date()
  const authValue = client.dialect === 'sqlite' ? JSON.stringify(cfg.auth ?? {}) : (cfg.auth ?? {})
  const schemaValue = client.dialect === 'sqlite' ? JSON.stringify(cfg.credentialSchema ?? {}) : (cfg.credentialSchema ?? {})

  await (client.db as any)
    .insert(table)
    .values({
      id: cfg.id,
      spaceId: cfg.spaceId,
      typeSlug: cfg.typeSlug,
      label: cfg.label,
      baseUrl: cfg.baseUrl,
      authJson: authValue,
      credentialSchemaJson: schemaValue,
      healthCheckPath: cfg.healthCheckPath ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: table.id,
      set: {
        typeSlug: cfg.typeSlug,
        label: cfg.label,
        baseUrl: cfg.baseUrl,
        authJson: authValue,
        credentialSchemaJson: schemaValue,
        healthCheckPath: cfg.healthCheckPath ?? null,
        updatedAt: now,
      },
    })
}

