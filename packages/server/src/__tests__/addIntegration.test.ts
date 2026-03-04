import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { ToolListChangedNotificationSchema } from '@modelcontextprotocol/sdk/types.js'

import { createDb } from '../db/client.js'
import { ensureSchema } from '../db/migrate.js'
import { SqlCredentialStore } from '../db/credentialStore.js'
import { IntegrationProxy } from '../integrations/proxy.js'
import type { IntegrationData } from '../types.js'
import { AbilityCatalog } from '../mcp/abilityCatalog.js'
import { SessionAbilityState } from '../mcp/sessionState.js'
import { META_TOOL_NAMES } from '../mcp/metaTools.js'
import { registerToolHandlers } from '../mcp/handlers.js'

const integrationDataDir = fileURLToPath(new URL('../../../integration-data/integrations', import.meta.url))

function makeTempSqlitePath(): string {
  const rand = Math.random().toString(16).slice(2)
  return fileURLToPath(new URL(`./tmp-add-integration-${Date.now()}-${rand}.sqlite`, import.meta.url))
}

describe('meta: add integration from catalog', () => {
  it('adds an integration, registers toolsets, and enables a toolset in-session', async () => {
    process.env.COMMANDABLE_INTEGRATION_DATA_DIR = integrationDataDir

    const db = createDb({ sqlitePath: makeTempSqlitePath() })
    await ensureSchema(db)

    const credentialStore = new SqlCredentialStore(db, 'test-secret')
    const proxy = new IntegrationProxy({ credentialStore })

    const integrationsRef = { current: [] as IntegrationData[] }
    const toolIndex = { list: [] as any[], byName: new Map<string, any>() }
    const catalogRef = { current: new AbilityCatalog({ integrations: integrationsRef.current, toolIndex: toolIndex.byName }) }
    const sessionState = new SessionAbilityState()

    const server = new Server({ name: 'test', version: '0.0.0' }, { capabilities: { tools: { listChanged: true } } })
    registerToolHandlers(server, toolIndex as any, {
      catalogRef,
      sessionState,
      ctx: {
        spaceId: 'local',
        db,
        credentialStore,
        proxy,
        credentialSetupBaseUrl: 'http://127.0.0.1:23432',
        integrationsRef,
        toolIndexRef: toolIndex as any,
        catalogRef,
      },
    } as any)

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
    await server.connect(serverTransport as any)

    let listChanged = 0
    const client = new Client({ name: 'test-client', version: '0.0.0' })
    client.setNotificationHandler(ToolListChangedNotificationSchema, () => { listChanged++ })
    await client.connect(clientTransport as any)

    const initial = await client.listTools()
    const initialNames = initial.tools.map(t => t.name)
    expect(initialNames).toContain(META_TOOL_NAMES.searchTools)
    expect(initialNames).toContain(META_TOOL_NAMES.enableToolset)
    expect(initialNames).toContain(META_TOOL_NAMES.disableToolset)
    expect(initialNames).toContain(META_TOOL_NAMES.listIntegrations)
    expect(initialNames).toContain(META_TOOL_NAMES.addIntegration)

    const addRes = await client.callTool({
      name: META_TOOL_NAMES.addIntegration,
      arguments: { type: 'trello' },
    } as any)
    const parsedAdd = JSON.parse((addRes.content as any)[0].text)
    expect(parsedAdd.added).toBe(true)
    expect(parsedAdd.integration?.type).toBe('trello')
    expect(parsedAdd.credential_url).toContain('/integrations/')
    expect(parsedAdd.management_url).toContain('/integrations')
    expect(Array.isArray(parsedAdd.toolsets)).toBe(true)
    expect(parsedAdd.toolsets.length).toBeGreaterThan(0)

    const searchRes = await client.callTool({
      name: META_TOOL_NAMES.searchTools,
      arguments: { query: 'trello', limit: 10 },
    } as any)
    const parsedSearch = JSON.parse((searchRes.content as any)[0].text)
    expect(parsedSearch.toolsets.some((t: any) => t.integration_type === 'trello')).toBe(true)

    const toolsetId = parsedAdd.toolsets[0].toolset_id
    const loadRes = await client.callTool({ name: META_TOOL_NAMES.enableToolset, arguments: { toolset_id: toolsetId } } as any)
    const parsedLoad = JSON.parse((loadRes.content as any)[0].text)
    expect(parsedLoad.loaded).toBe(true)
    expect(Array.isArray(parsedLoad.new_tools)).toBe(true)
    expect(parsedLoad.new_tools.length).toBeGreaterThan(0)

    for (let i = 0; i < 10 && listChanged === 0; i++)
      await new Promise(resolve => setTimeout(resolve, 1))
    expect(listChanged).toBeGreaterThan(0)

    const afterLoad = await client.listTools()
    const afterNames = afterLoad.tools.map(t => t.name)
    expect(afterNames).toContain(parsedLoad.new_tools[0])

    // Catalog listing includes configured instance
    const listRes = await client.callTool({ name: META_TOOL_NAMES.listIntegrations, arguments: { query: 'trello' } } as any)
    const parsedList = JSON.parse((listRes.content as any)[0].text)
    const trelloItem = parsedList.integrations.find((x: any) => x.type === 'trello')
    expect(trelloItem.configured).toBe(true)
    expect(trelloItem.instances.length).toBeGreaterThan(0)

    db.close()
  })
})

