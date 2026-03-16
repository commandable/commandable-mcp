import { describe, expect, it } from 'vitest'
import { AbilityCatalog } from '../mcp/abilityCatalog.js'
import { getBuilderToolDefinitions, META_TOOL_NAMES } from '../mcp/metaTools.js'

describe('builder meta tools', () => {
  it('exposes upsert and delete tools with expected names', () => {
    const names = getBuilderToolDefinitions().map(def => def.name)
    expect(names).toContain(META_TOOL_NAMES.upsertCustomIntegration)
    expect(names).toContain(META_TOOL_NAMES.upsertCustomTool)
    expect(names).toContain(META_TOOL_NAMES.deleteCustomTool)
    expect(names).toContain(META_TOOL_NAMES.deleteCustomIntegration)
  })

  it('supports optional type_slug for integration upsert', () => {
    const upsert = getBuilderToolDefinitions()
      .find(def => def.name === META_TOOL_NAMES.upsertCustomIntegration)
    expect(upsert).toBeTruthy()
    const properties = (upsert!.inputSchema as any).properties || {}
    expect(properties.type_slug).toBeTruthy()
  })

  it('wires the builder ability to renamed tools', () => {
    const catalog = new AbilityCatalog({
      integrations: [],
      toolIndex: new Map(),
      extraToolDefinitions: new Map(),
    })
    const builder = catalog.getAbility('commandable__builder')
    expect(builder?.toolNames).toContain(META_TOOL_NAMES.upsertCustomTool)
    expect(builder?.toolNames).toContain(META_TOOL_NAMES.deleteCustomTool)
  })

  it('can exclude the builder ability for plain dynamic mode', () => {
    const catalog = new AbilityCatalog({
      integrations: [],
      toolIndex: new Map(),
      extraToolDefinitions: new Map(),
      includeBuilderAbility: false,
    })

    expect(catalog.getAbility('commandable__builder')).toBeUndefined()
  })
})
