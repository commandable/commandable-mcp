import type { Implementation } from '@modelcontextprotocol/sdk/types.js'
import { listToolDefinitions } from '../db/toolDefinitionStore.js'
import { listIntegrationTypeConfigs } from '../db/integrationTypeConfigStore.js'
import { listIntegrations } from '../db/integrationStore.js'
import type { AbilityCatalog } from '../mcp/abilityCatalog.js'
import { IntegrationProxy } from '../integrations/proxy.js'
import type { SessionAbilityState } from '../mcp/sessionState.js'
import { buildMcpToolIndex } from '../mcp/toolAdapter.js'
import { getBuilderToolDefinitions, type MetaToolContext } from '../mcp/metaTools.js'
import { SessionAbilityState as SessionAbilityStateImpl } from '../mcp/sessionState.js'
import { AbilityCatalog as AbilityCatalogImpl } from '../mcp/abilityCatalog.js'
import { runStdioMcpServer } from '../mcp/server.js'
import { openLocalState } from './credentialManager.js'

export type LocalStdioMode = 'static' | 'create'

export interface RunLocalStdioSessionParams {
  mode: LocalStdioMode
  serverInfo?: Implementation
}

function getSpaceId(): string {
  const value = process.env.COMMANDABLE_SPACE_ID
  return value && value.trim().length ? value.trim() : 'local'
}

function getUiPort(): number {
  const raw = process.env.COMMANDABLE_UI_PORT
  return raw && /^\d+$/.test(raw) ? Number(raw) : 23432
}

export async function runLocalStdioSession(params: RunLocalStdioSessionParams): Promise<void> {
  const spaceId = getSpaceId()
  const { db, credentialStore } = await openLocalState()
  const integrations = await listIntegrations(db, spaceId)
  const toolDefinitions = await listToolDefinitions(db, spaceId)
  const integrationTypeConfigs = await listIntegrationTypeConfigs(db, spaceId)
  const integrationsRef = { current: integrations }
  const integrationTypeConfigsRef = { current: integrationTypeConfigs }

  const proxy = new IntegrationProxy({
    credentialStore,
    trelloApiKey: process.env.TRELLO_API_KEY,
    integrationTypeConfigsRef,
  })

  if (!integrations.length && params.mode !== 'create') {
    console.error('No integrations are configured yet.')
    console.error('Start the local server with "npx -y @commandable/mcp serve", then run "npx -y @commandable/mcp create" first.')
    process.exit(1)
  }

  const index = buildMcpToolIndex({
    spaceId,
    integrations,
    proxy,
    integrationsRef,
    toolDefinitions,
  })

  const toolIndex = { list: index.tools, byName: index.byName }
  const baseUrl = `http://127.0.0.1:${getUiPort()}`

  await runStdioMcpServer({
    serverInfo: params.serverInfo || { name: 'commandable', version: '0.0.0' },
    tools: toolIndex,
    ...(params.mode === 'create'
      ? {
          createMode: (() => {
            const builderDefs = getBuilderToolDefinitions()
            const extraToolDefinitions = new Map(builderDefs.map(definition => [definition.name, definition]))
            const catalogRef: { current: AbilityCatalog } = {
              current: new AbilityCatalogImpl({
                integrations: integrationsRef.current,
                toolIndex: toolIndex.byName,
                extraToolDefinitions,
              }),
            }
            const sessionState: SessionAbilityState = new SessionAbilityStateImpl()
            const ctx: MetaToolContext = {
              spaceId,
              db,
              credentialStore,
              proxy,
              credentialSetupBaseUrl: baseUrl,
              integrationsRef,
              integrationTypeConfigsRef,
              toolIndexRef: toolIndex,
              catalogRef,
            }
            return { catalogRef, sessionState, ctx }
          })(),
        }
      : {}),
  })
}
