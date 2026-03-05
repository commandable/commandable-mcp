import { and, eq } from 'drizzle-orm'
import type { DbClient } from './client.js'
import { pgToolDefinitions, sqliteToolDefinitions } from './schema.js'
import type { ToolDefinition, ToolScope } from '../types.js'

function normalizeScope(raw: any): ToolScope {
  const s = String(raw || '').toLowerCase().trim()
  if (s === 'read' || s === 'write' || s === 'admin')
    return s
  return 'write'
}

function parseJson(raw: any): any {
  if (raw == null)
    return null
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) } catch { return null }
  }
  return raw
}

function rowToToolDefinition(client: DbClient, r: any): ToolDefinition {
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
    displayName: r.displayName ?? null,
    description: r.description,
    scope: normalizeScope(r.scope),
    inputSchema: parseJson(r.inputSchemaJson) || { type: 'object', additionalProperties: true },
    handlerCode: r.handlerCode,
    utils: parseJson(r.utilsJson),
    createdAt,
    updatedAt,
  }
}

export async function listToolDefinitions(client: DbClient, spaceId: string): Promise<ToolDefinition[]> {
  const table: any = client.dialect === 'sqlite' ? sqliteToolDefinitions : pgToolDefinitions
  const rows = await (client.db as any)
    .select()
    .from(table)
    .where(eq(table.spaceId, spaceId))
  return rows.map((r: any) => rowToToolDefinition(client, r))
}

export async function getToolDefinitionByName(
  client: DbClient,
  spaceId: string,
  integrationId: string,
  name: string,
): Promise<ToolDefinition | null> {
  const table: any = client.dialect === 'sqlite' ? sqliteToolDefinitions : pgToolDefinitions
  const rows = await (client.db as any)
    .select()
    .from(table)
    .where(and(eq(table.spaceId, spaceId), eq(table.integrationId, integrationId), eq(table.name, name)))
    .limit(1)
  return rows?.[0] ? rowToToolDefinition(client, rows[0]) : null
}

export async function upsertToolDefinition(
  client: DbClient,
  tool: Required<Pick<ToolDefinition, 'id' | 'spaceId' | 'integrationId'>> & Omit<ToolDefinition, 'createdAt' | 'updatedAt'>,
): Promise<void> {
  const table: any = client.dialect === 'sqlite' ? sqliteToolDefinitions : pgToolDefinitions
  const now = new Date()

  const schemaValue = client.dialect === 'sqlite' ? JSON.stringify(tool.inputSchema ?? {}) : (tool.inputSchema ?? {})
  const utilsValue = tool.utils?.length
    ? (client.dialect === 'sqlite' ? JSON.stringify(tool.utils) : tool.utils)
    : null

  await (client.db as any)
    .insert(table)
    .values({
      id: tool.id,
      spaceId: tool.spaceId,
      integrationId: tool.integrationId,
      name: tool.name,
      displayName: tool.displayName ?? null,
      description: tool.description,
      scope: tool.scope,
      inputSchemaJson: schemaValue,
      handlerCode: tool.handlerCode,
      utilsJson: utilsValue,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: table.id,
      set: {
        integrationId: tool.integrationId,
        name: tool.name,
        displayName: tool.displayName ?? null,
        description: tool.description,
        scope: tool.scope,
        inputSchemaJson: schemaValue,
        handlerCode: tool.handlerCode,
        utilsJson: utilsValue,
        updatedAt: now,
      },
    })
}

