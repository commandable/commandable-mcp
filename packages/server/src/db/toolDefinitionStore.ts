import { and, eq } from 'drizzle-orm'
import type { DbClient } from './client.js'
import { pgToolDefinitions, sqliteToolDefinitions } from './schema.js'
import type { ToolDefinition, ToolScope } from '../types.js'

function t(client: DbClient) {
  return client.dialect === 'sqlite' ? sqliteToolDefinitions : pgToolDefinitions
}

function db(client: DbClient): any {
  return client.db
}

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

function rowToToolDefinition(r: any): ToolDefinition {
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
    createdAt: r.createdAt instanceof Date ? r.createdAt : (r.createdAt ? new Date(r.createdAt) : undefined),
    updatedAt: r.updatedAt instanceof Date ? r.updatedAt : (r.updatedAt ? new Date(r.updatedAt) : undefined),
  }
}

export async function listToolDefinitions(client: DbClient, spaceId: string): Promise<ToolDefinition[]> {
  const rows: any[] = await db(client).select().from(t(client)).where(eq(t(client).spaceId, spaceId))
  return rows.map(rowToToolDefinition)
}

export async function getToolDefinitionByName(
  client: DbClient,
  spaceId: string,
  integrationId: string,
  name: string,
): Promise<ToolDefinition | null> {
  const table = t(client)
  const rows: any[] = await db(client)
    .select()
    .from(table)
    .where(and(eq(table.spaceId, spaceId), eq(table.integrationId, integrationId), eq(table.name, name)))
    .limit(1)
  return rows[0] ? rowToToolDefinition(rows[0]) : null
}

export async function upsertToolDefinition(
  client: DbClient,
  tool: Required<Pick<ToolDefinition, 'id' | 'spaceId' | 'integrationId'>> & Omit<ToolDefinition, 'createdAt' | 'updatedAt'>,
): Promise<void> {
  const table = t(client)
  const now = new Date()
  const schemaValue = client.dialect === 'sqlite' ? JSON.stringify(tool.inputSchema ?? {}) : (tool.inputSchema ?? {})
  const utilsValue = tool.utils?.length
    ? (client.dialect === 'sqlite' ? JSON.stringify(tool.utils) : tool.utils)
    : null

  await db(client)
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
