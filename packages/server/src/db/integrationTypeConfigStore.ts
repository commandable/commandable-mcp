import { and, eq } from 'drizzle-orm'
import type { DbClient } from './client.js'
import { pgIntegrationTypeConfigs, sqliteIntegrationTypeConfigs } from './schema.js'
import type { IntegrationCredentialVariant, IntegrationTypeConfig } from '../types.js'

function t(client: DbClient) {
  return client.dialect === 'sqlite' ? sqliteIntegrationTypeConfigs : pgIntegrationTypeConfigs
}

function db(client: DbClient): any {
  return client.db
}

function parseJson(raw: any): any {
  if (raw == null)
    return null
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) } catch { return null }
  }
  return raw
}

function rowToIntegrationTypeConfig(r: any): IntegrationTypeConfig {
  return {
    id: r.id,
    spaceId: r.spaceId,
    typeSlug: r.typeSlug,
    label: r.label,
    defaultVariant: r.defaultVariant,
    variants: parseJson(r.variantsJson) as Record<string, IntegrationCredentialVariant> || {},
    createdAt: r.createdAt instanceof Date ? r.createdAt : (r.createdAt ? new Date(r.createdAt) : undefined),
    updatedAt: r.updatedAt instanceof Date ? r.updatedAt : (r.updatedAt ? new Date(r.updatedAt) : undefined),
  }
}

export async function listIntegrationTypeConfigs(client: DbClient, spaceId: string): Promise<IntegrationTypeConfig[]> {
  const rows: any[] = await db(client).select().from(t(client)).where(eq(t(client).spaceId, spaceId))
  return rows.map(rowToIntegrationTypeConfig)
}

export async function getIntegrationTypeConfig(
  client: DbClient,
  spaceId: string,
  typeSlug: string,
): Promise<IntegrationTypeConfig | null> {
  const table = t(client)
  const rows: any[] = await db(client)
    .select()
    .from(table)
    .where(and(eq(table.spaceId, spaceId), eq(table.typeSlug, typeSlug)))
    .limit(1)
  return rows[0] ? rowToIntegrationTypeConfig(rows[0]) : null
}

export async function upsertIntegrationTypeConfig(
  client: DbClient,
  cfg: Required<Pick<IntegrationTypeConfig, 'id' | 'spaceId'>> & Omit<IntegrationTypeConfig, 'createdAt' | 'updatedAt'>,
): Promise<void> {
  const table = t(client)
  const now = new Date()
  const variantsValue = client.dialect === 'sqlite'
    ? JSON.stringify(cfg.variants ?? {})
    : (cfg.variants ?? {})

  await db(client)
    .insert(table)
    .values({
      id: cfg.id,
      spaceId: cfg.spaceId,
      typeSlug: cfg.typeSlug,
      label: cfg.label,
      defaultVariant: cfg.defaultVariant,
      variantsJson: variantsValue,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: table.id,
      set: {
        typeSlug: cfg.typeSlug,
        label: cfg.label,
        defaultVariant: cfg.defaultVariant,
        variantsJson: variantsValue,
        updatedAt: now,
      },
    })
}
