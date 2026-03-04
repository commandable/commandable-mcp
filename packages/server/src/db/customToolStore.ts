import { and, eq } from 'drizzle-orm'
import type { DbClient } from './client.js'
import { pgCustomTools, sqliteCustomTools } from './schema.js'
import type { CustomToolData, CustomToolScope } from '../types.js'

function parseJsonSchema(raw: any): any {
  if (!raw)
    return null
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) } catch { return null }
  }
  return raw
}

function normalizeScope(raw: any): CustomToolScope {
  const s = String(raw || '').toLowerCase().trim()
  if (s === 'read' || s === 'write' || s === 'admin')
    return s
  return 'write'
}

function rowToCustomTool(client: DbClient, r: any): CustomToolData {
  const createdAt = client.dialect === 'sqlite'
    ? (r.createdAt ? new Date(r.createdAt) : undefined)
    : (r.createdAt ?? undefined)
  const updatedAt = client.dialect === 'sqlite'
    ? (r.updatedAt ? new Date(r.updatedAt) : undefined)
    : (r.updatedAt ?? undefined)

  return {
    id: r.id,
    spaceId: r.spaceId,
    integrationId: r.integrationId,
    name: r.name,
    label: r.label ?? null,
    description: r.description ?? null,
    inputSchema: parseJsonSchema(r.inputSchema) || { type: 'object', additionalProperties: true },
    handlerCode: r.handlerCode,
    scope: normalizeScope(r.scope),
    createdAt,
    updatedAt,
  }
}

export async function listCustomTools(client: DbClient, spaceId: string): Promise<CustomToolData[]> {
  const table: any = client.dialect === 'sqlite' ? sqliteCustomTools : pgCustomTools
  const rows = await (client.db as any)
    .select()
    .from(table)
    .where(eq(table.spaceId, spaceId))
  return rows.map((r: any) => rowToCustomTool(client, r))
}

export async function listCustomToolsForIntegration(
  client: DbClient,
  spaceId: string,
  integrationId: string,
): Promise<CustomToolData[]> {
  const table: any = client.dialect === 'sqlite' ? sqliteCustomTools : pgCustomTools
  const rows = await (client.db as any)
    .select()
    .from(table)
    .where(and(eq(table.spaceId, spaceId), eq(table.integrationId, integrationId)))
  return rows.map((r: any) => rowToCustomTool(client, r))
}

export async function getCustomToolByName(
  client: DbClient,
  spaceId: string,
  integrationId: string,
  name: string,
): Promise<CustomToolData | null> {
  const table: any = client.dialect === 'sqlite' ? sqliteCustomTools : pgCustomTools
  const rows = await (client.db as any)
    .select()
    .from(table)
    .where(and(eq(table.spaceId, spaceId), eq(table.integrationId, integrationId), eq(table.name, name)))
    .limit(1)
  return rows?.[0] ? rowToCustomTool(client, rows[0]) : null
}

export async function upsertCustomTool(
  client: DbClient,
  tool: Omit<CustomToolData, 'createdAt' | 'updatedAt'>,
): Promise<void> {
  const table: any = client.dialect === 'sqlite' ? sqliteCustomTools : pgCustomTools
  const now = new Date()

  await (client.db as any)
    .insert(table)
    .values({
      id: tool.id,
      spaceId: tool.spaceId,
      integrationId: tool.integrationId,
      name: tool.name,
      label: tool.label ?? null,
      description: tool.description ?? null,
      inputSchema: JSON.stringify(tool.inputSchema ?? {}),
      handlerCode: tool.handlerCode,
      scope: tool.scope,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: table.id,
      set: {
        integrationId: tool.integrationId,
        name: tool.name,
        label: tool.label ?? null,
        description: tool.description ?? null,
        inputSchema: JSON.stringify(tool.inputSchema ?? {}),
        handlerCode: tool.handlerCode,
        scope: tool.scope,
        updatedAt: now,
      },
    })
}

export async function deleteCustomTool(client: DbClient, spaceId: string, id: string): Promise<void> {
  const table: any = client.dialect === 'sqlite' ? sqliteCustomTools : pgCustomTools
  await (client.db as any)
    .delete(table)
    .where(and(eq(table.spaceId, spaceId), eq(table.id, id)))
}

