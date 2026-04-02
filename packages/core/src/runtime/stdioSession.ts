import type { Implementation } from '@modelcontextprotocol/sdk/types.js'
import { listToolDefinitions } from '../db/toolDefinitionStore.js'
import { listIntegrationTypeConfigs } from '../db/integrationTypeConfigStore.js'
import { listIntegrations } from '../db/integrationStore.js'
import { applyFileProcessingCapabilityToIntegrations, getFileProcessingCapability } from '../integrations/fileProcessing.js'
import { IntegrationProxy } from '../integrations/proxy.js'
import { buildMcpToolIndex } from '../mcp/toolAdapter.js'
import { getBuilderToolDefinitions, type MetaToolContext } from '../mcp/metaTools.js'
import { SessionAbilityState } from '../mcp/sessionState.js'
import { AbilityCatalog } from '../mcp/abilityCatalog.js'
import { runStdioMcpServer, type DynamicModeContext } from '../mcp/server.js'
import { openLocalState } from './credentialManager.js'

export type LocalStdioMode = 'static' | 'dynamic' | 'create'

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
  const fileProcessing = await getFileProcessingCapability()
  const integrations = applyFileProcessingCapabilityToIntegrations(
    await listIntegrations(db, spaceId),
    fileProcessing,
  )
  const toolDefinitions = await listToolDefinitions(db, spaceId)
  const integrationTypeConfigs = await listIntegrationTypeConfigs(db, spaceId)
  const integrationsRef = { current: integrations }
  const integrationTypeConfigsRef = { current: integrationTypeConfigs }

  const proxy = new IntegrationProxy({
    credentialStore,
    integrationTypeConfigsRef,
  })

  if (!integrations.length && params.mode === 'static') {
    console.error('No integrations are configured yet.')
    console.error('Start the local server with "npx -y @commandable/mcp serve", then configure it with "npx -y @commandable/mcp create" first.')
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
  const buildDynamicModeContext = (mode: Extract<LocalStdioMode, 'dynamic' | 'create'>): DynamicModeContext => {
    const includeBuilderAbility = mode === 'create'
    const builderDefs = includeBuilderAbility ? getBuilderToolDefinitions() : []
    const extraToolDefinitions = new Map(builderDefs.map(definition => [definition.name, definition]))
    const catalogRef = {
      current: new AbilityCatalog({
        integrations: integrationsRef.current,
        toolIndex: toolIndex.byName,
        extraToolDefinitions,
        includeBuilderAbility,
      }),
    }
    const sessionState = new SessionAbilityState()
    const ctx: MetaToolContext | undefined = includeBuilderAbility
      ? {
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
      : undefined

    return { catalogRef, sessionState, ctx }
  }

  await runStdioMcpServer({
    serverInfo: params.serverInfo || { name: 'commandable', version: '0.0.0' },
    tools: toolIndex,
    mode: params.mode,
    ...(params.mode === 'dynamic' || params.mode === 'create'
      ? { dynamicMode: buildDynamicModeContext(params.mode) }
      : {}),
  })
}
