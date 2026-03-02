import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { ToolListChangedNotificationSchema } from '@modelcontextprotocol/sdk/types.js'

import type { IntegrationData } from '../types.js'
import { IntegrationProxy } from '../integrations/proxy.js'
import { makeIntegrationToolName } from '../integrations/tools.js'
import { buildMcpToolIndex } from '../mcp/toolAdapter.js'
import { registerToolHandlers } from '../mcp/handlers.js'
import { AbilityCatalog } from '../mcp/abilityCatalog.js'
import { SessionAbilityState } from '../mcp/sessionState.js'
import { META_TOOL_NAMES } from '../mcp/metaTools.js'

const integrationDataDir = fileURLToPath(new URL('../../../integration-data/integrations', import.meta.url))

function makeGithubIntegration(): IntegrationData {
  return {
    id: 'abcd-1234-efgh-5678',
    referenceId: 'github_test',
    type: 'github',
    label: 'GitHub Test',
    enabledToolsets: ['pull_requests'],
    // ensure we have both read+write for github PRs
    maxScope: 'write',
    disabledTools: [],
  }
}

describe('ability mode (abilities + dynamic tools/list)', () => {
  it('AbilityCatalog builds toolset abilities and can search them', () => {
    process.env.COMMANDABLE_INTEGRATION_DATA_DIR = integrationDataDir

    const integrations = [makeGithubIntegration()]
    const proxy = new IntegrationProxy({})
    const index = buildMcpToolIndex({ spaceId: 'local', integrations, proxy })

    const catalog = new AbilityCatalog({ integrations, toolIndex: index.byName })
    const res = catalog.search('pull requests', 5)
    expect(res.length).toBeGreaterThan(0)
    expect(res[0]!.label.toLowerCase()).toContain('pull')
    expect(res[0]!.toolNames.length).toBeGreaterThan(0)
    // ability ids include the integration instance suffix
    expect(res[0]!.id).toContain('__n')
  })

  it('SessionAbilityState unions tools across loaded abilities', () => {
    const st = new SessionAbilityState()
    const a1 = { id: 'a1', integrationtype: 'x', integrationLabel: 'X', label: 'A1', description: '', toolNames: ['t1', 't2'] }
    const a2 = { id: 'a2', integrationtype: 'x', integrationLabel: 'X', label: 'A2', description: '', toolNames: ['t2', 't3'] }

    expect(st.getActiveToolNames(undefined).size).toBe(0)
    st.loadAbility(undefined, a1 as any)
    st.loadAbility(undefined, a2 as any)
    expect([...st.getActiveToolNames(undefined)].sort()).toEqual(['t1', 't2', 't3'])

    st.unloadAbility(undefined, a1 as any)
    expect([...st.getActiveToolNames(undefined)].sort()).toEqual(['t2', 't3'])
  })

  it('end-to-end: list->search->load triggers list_changed and tools appear, unload removes them', async () => {
    process.env.COMMANDABLE_INTEGRATION_DATA_DIR = integrationDataDir

    const integration = makeGithubIntegration()
    const integrations = [integration]
    const proxy = new IntegrationProxy({})
    const index = buildMcpToolIndex({ spaceId: 'local', integrations, proxy })

    const catalog = new AbilityCatalog({ integrations, toolIndex: index.byName })
    const sessionState = new SessionAbilityState()

    const server = new Server({ name: 'test', version: '0.0.0' }, { capabilities: { tools: { listChanged: true } } })
    registerToolHandlers(server, { list: index.tools, byName: index.byName }, { catalog, sessionState })

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
    await server.connect(serverTransport as any)

    let toolsListChangedCount = 0
    const client = new Client(
      { name: 'test-client', version: '0.0.0' },
    )
    client.setNotificationHandler(ToolListChangedNotificationSchema, () => {
      toolsListChangedCount++
    })
    await client.connect(clientTransport as any)

    const initial = await client.listTools()
    expect(initial.tools.map(t => t.name).sort()).toEqual([
      META_TOOL_NAMES.loadAbility,
      META_TOOL_NAMES.searchAbilities,
      META_TOOL_NAMES.unloadAbility,
    ].sort())

    const prToolName = makeIntegrationToolName('github', 'list_pull_requests', integration.id)
    await expect(client.callTool({ name: prToolName, arguments: {} } as any)).rejects.toBeTruthy()

    const searchRes = await client.callTool({
      name: META_TOOL_NAMES.searchAbilities,
      arguments: { query: 'pull requests', limit: 5 },
    } as any)
    const parsedSearch = JSON.parse((searchRes.content as any)[0].text)
    expect(Array.isArray(parsedSearch.abilities)).toBe(true)
    expect(parsedSearch.abilities.length).toBeGreaterThan(0)

    const abilityId = parsedSearch.abilities[0].ability_id
    const loadRes = await client.callTool({ name: META_TOOL_NAMES.loadAbility, arguments: { ability_id: abilityId } } as any)
    expect(JSON.parse((loadRes.content as any)[0].text).loaded).toBe(true)

    // Notification handling is async; give it a tick to arrive.
    for (let i = 0; i < 10 && toolsListChangedCount === 0; i++)
      await new Promise(resolve => setTimeout(resolve, 1))
    expect(toolsListChangedCount).toBeGreaterThan(0)

    const afterLoad = await client.listTools()
    const afterNames = afterLoad.tools.map(t => t.name)
    expect(afterNames).toContain(META_TOOL_NAMES.searchAbilities)
    expect(afterNames).toContain(prToolName)

    const unloadRes = await client.callTool({ name: META_TOOL_NAMES.unloadAbility, arguments: { ability_id: abilityId } } as any)
    expect(JSON.parse((unloadRes.content as any)[0].text).unloaded).toBe(true)

    const afterUnload = await client.listTools()
    expect(afterUnload.tools.map(t => t.name).sort()).toEqual([
      META_TOOL_NAMES.loadAbility,
      META_TOOL_NAMES.searchAbilities,
      META_TOOL_NAMES.unloadAbility,
    ].sort())
  })
})

