import { describe, expect, it } from 'vitest'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'

import { createSafeHandlerFromString } from '../integrations/sandbox.js'
import { buildSandboxUtils } from '../integrations/sandboxUtils.js'
import { registerToolHandlers } from '../mcp/handlers.js'
import { SessionAbilityState } from '../mcp/sessionState.js'
import type { ExecutableTool } from '../types.js'

async function connectServer(server: Server) {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  await server.connect(serverTransport as any)

  const client = new Client({ name: 'test-client', version: '0.0.0' })
  await client.connect(clientTransport as any)
  return client
}

describe('registerToolHandlers artifact rendering', () => {
  function makeExtractingTool(): ExecutableTool {
    const utils = buildSandboxUtils([], {
      extractFileContent: async () => ({
        kind: 'pdf',
        content: 'Hello world',
        pageImages: ['cG5n'],
      }),
    })

    return {
      name: 'demo_tool',
      displayName: 'Demo Tool',
      description: 'Returns extracted file content',
      inputSchema: { type: 'object', additionalProperties: false },
      run: createSafeHandlerFromString(
        `async () => {
          const extracted = await utils.extractFileContent({
            auth: false,
            source: 'https://example.com/test.pdf',
            previewPages: 1,
          })
          return {
            ok: true,
            ...extracted,
          }
        }`,
        () => ({}),
        utils,
      ),
    }
  }

  it('renders hoisted extractFileContent images in static mode', async () => {
    const tool = makeExtractingTool()

    const server = new Server({ name: 'test', version: '0.0.0' }, { capabilities: { tools: {} } })
    registerToolHandlers(server, {
      list: [{ name: tool.name, description: tool.description, inputSchema: tool.inputSchema }],
      byName: new Map([[tool.name, tool]]),
    }, { mode: 'static' })

    const client = await connectServer(server)
    const response = await client.callTool({ name: tool.name, arguments: {} } as any)
    const content = response.content as any[]

    expect(content[0]).toEqual({ type: 'text', text: JSON.stringify({ ok: true, kind: 'pdf', content: 'Hello world' }, null, 2) })
    expect(content[1]).toEqual({ type: 'image', mimeType: 'image/jpeg', data: 'cG5n' })
  })

  it('renders hoisted extractFileContent images in dynamic mode', async () => {
    const tool = makeExtractingTool()

    const sessionState = new SessionAbilityState()
    sessionState.loadAbility(undefined, {
      id: 'ability-1',
      integrationtype: 'demo',
      integrationLabel: 'Demo',
      label: 'Demo Ability',
      description: 'Demo ability',
      toolNames: [tool.name],
    } as any)

    const server = new Server({ name: 'test', version: '0.0.0' }, { capabilities: { tools: {} } })
    registerToolHandlers(server, {
      list: [],
      byName: new Map(),
    }, {
      mode: 'dynamic',
      dynamicMode: {
        catalogRef: {
          current: {
            getToolDefinitions: () => [],
            getExecutableTool: (name: string) => name === tool.name ? tool : undefined,
          },
        },
        sessionState,
      },
    })

    const client = await connectServer(server)
    const response = await client.callTool({ name: tool.name, arguments: {} } as any)
    const content = response.content as any[]

    expect(content[0]).toEqual({ type: 'text', text: JSON.stringify({ ok: true, kind: 'pdf', content: 'Hello world' }, null, 2) })
    expect(content[1]).toEqual({ type: 'image', mimeType: 'image/jpeg', data: 'cG5n' })
  })
})
