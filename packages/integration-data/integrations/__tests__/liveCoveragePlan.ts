import { listIntegrationCatalog, loadIntegrationManifest } from '../../src/loader.js'
import { xeroLiveCoverageSkips } from '../xero/__tests__/liveCoverageSkips.js'

export type LiveCoverageScope = 'read' | 'write' | 'admin'

export type LiveCoveragePlanEntry = {
  id: string
  integrationName: string
  credentialVariant?: string
  toolsets?: string[]
  scopes?: LiveCoverageScope[]
  onlyTools?: string[]
  skippedTools?: Record<string, string>
}

export const googleCalendarWriteAdminSkips: Record<string, string> = {
  quick_add: 'Set GOOGLE_CALENDAR_TEST_QUICK_ADD=1 to run the quick_add live test.',
  move_event: 'Set GOOGLE_CALENDAR_TEST_MOVE_DEST to a destination calendar id to run the move_event live test.',
  insert_acl: 'Set GOOGLE_CALENDAR_TEST_ADMIN_WRITE=1 to run ACL mutation live tests (insert/get/update/delete_acl).',
  get_acl: 'Set GOOGLE_CALENDAR_TEST_ADMIN_WRITE=1 to run ACL mutation live tests (insert/get/update/delete_acl).',
  update_acl: 'Set GOOGLE_CALENDAR_TEST_ADMIN_WRITE=1 to run ACL mutation live tests (insert/get/update/delete_acl).',
  delete_acl: 'Set GOOGLE_CALENDAR_TEST_ADMIN_WRITE=1 to run ACL mutation live tests (insert/get/update/delete_acl).',
}

export const githubFineGrainedWriteSkips: Record<string, string> = {
  fork_repo: 'Fine-grained PATs are normally scoped to specific repositories; fork creation is account-level, noisy, and not reliably cleanup-safe in live CI.',
}

export const liveCoveragePlan: LiveCoveragePlanEntry[] = [
  { id: 'airtable-read', integrationName: 'airtable', scopes: ['read'] },
  { id: 'airtable-write', integrationName: 'airtable', scopes: ['write'] },

  { id: 'confluence-api-token-read', integrationName: 'confluence', credentialVariant: 'api_token', scopes: ['read'] },
  { id: 'confluence-api-token-write', integrationName: 'confluence', credentialVariant: 'api_token', scopes: ['write'] },

  { id: 'github-classic-pat-read', integrationName: 'github', credentialVariant: 'classic_pat', scopes: ['read'] },
  { id: 'github-classic-pat-write', integrationName: 'github', credentialVariant: 'classic_pat', scopes: ['write'] },
  { id: 'github-fine-grained-pat-read', integrationName: 'github', credentialVariant: 'fine_grained_pat', scopes: ['read'] },
  { id: 'github-fine-grained-pat-write', integrationName: 'github', credentialVariant: 'fine_grained_pat', scopes: ['write'], skippedTools: githubFineGrainedWriteSkips },

  { id: 'google-calendar-read', integrationName: 'google-calendar', scopes: ['read'] },
  { id: 'google-calendar-write-admin', integrationName: 'google-calendar', scopes: ['write', 'admin'], skippedTools: googleCalendarWriteAdminSkips },

  { id: 'google-gmail-service-account', integrationName: 'google-gmail', credentialVariant: 'service_account' },
  { id: 'google-gmail-oauth-token', integrationName: 'google-gmail', credentialVariant: 'oauth_token' },

  { id: 'google-workspace-drive-service-account', integrationName: 'google-workspace', credentialVariant: 'service_account', toolsets: ['drive'] },
  { id: 'google-workspace-drive-oauth-token', integrationName: 'google-workspace', credentialVariant: 'oauth_token', toolsets: ['drive'] },
  { id: 'google-workspace-docs-service-account-read', integrationName: 'google-workspace', credentialVariant: 'service_account', toolsets: ['docs'], scopes: ['read'] },
  { id: 'google-workspace-docs-service-account-write', integrationName: 'google-workspace', credentialVariant: 'service_account', toolsets: ['docs'], scopes: ['write'] },
  { id: 'google-workspace-docs-oauth-token-read', integrationName: 'google-workspace', credentialVariant: 'oauth_token', toolsets: ['docs'], scopes: ['read'] },
  { id: 'google-workspace-docs-oauth-token-write', integrationName: 'google-workspace', credentialVariant: 'oauth_token', toolsets: ['docs'], scopes: ['write'] },
  { id: 'google-workspace-sheets-read', integrationName: 'google-workspace', toolsets: ['sheets'], scopes: ['read'] },
  { id: 'google-workspace-sheets-write', integrationName: 'google-workspace', toolsets: ['sheets'], scopes: ['write'] },
  { id: 'google-workspace-slides-read', integrationName: 'google-workspace', toolsets: ['slides'], scopes: ['read'] },
  { id: 'google-workspace-slides-write', integrationName: 'google-workspace', toolsets: ['slides'], scopes: ['write'] },

  { id: 'hubspot-read', integrationName: 'hubspot', scopes: ['read'] },
  { id: 'hubspot-write', integrationName: 'hubspot', scopes: ['write'] },

  { id: 'jira-api-token-read', integrationName: 'jira', credentialVariant: 'api_token', scopes: ['read'] },
  { id: 'jira-api-token-write', integrationName: 'jira', credentialVariant: 'api_token', scopes: ['write'] },

  { id: 'notion-read', integrationName: 'notion', scopes: ['read'] },
  { id: 'notion-write', integrationName: 'notion', scopes: ['write'] },

  { id: 'sharepoint-app-credentials', integrationName: 'sharepoint', credentialVariant: 'app_credentials' },

  { id: 'trello-read', integrationName: 'trello', scopes: ['read'] },
  { id: 'trello-write', integrationName: 'trello', scopes: ['write'] },

  { id: 'xero-custom-connection', integrationName: 'xero', credentialVariant: 'custom_connection', skippedTools: xeroLiveCoverageSkips },
]

type ManifestTool = {
  name: string
  scope?: LiveCoverageScope
  toolset?: string
  credentialVariants?: string[]
}

function targetKey(credentialVariant: string | undefined, toolName: string) {
  return `${credentialVariant ?? '*'}:${toolName}`
}

function appliesToCredentialVariant(tool: ManifestTool, credentialVariant: string | undefined) {
  if (!tool.credentialVariants?.length)
    return true
  return credentialVariant ? tool.credentialVariants.includes(credentialVariant) : false
}

export function getPlanEntry(id: string): LiveCoveragePlanEntry {
  const entry = liveCoveragePlan.find(item => item.id === id)
  if (!entry)
    throw new Error(`Missing live coverage plan entry '${id}'`)
  return entry
}

export function getPlannedTools(entry: LiveCoveragePlanEntry): ManifestTool[] {
  const manifest = loadIntegrationManifest(entry.integrationName)
  if (!manifest)
    throw new Error(`Missing integration manifest for '${entry.integrationName}'`)

  const allTools = manifest.tools as ManifestTool[]
  const allNames = new Set(allTools.map(tool => tool.name))

  let tools = allTools.filter(tool => appliesToCredentialVariant(tool, entry.credentialVariant))

  if (entry.onlyTools?.length) {
    const unknown = entry.onlyTools.filter(name => !allNames.has(name))
    if (unknown.length)
      throw new Error(`Live coverage plan '${entry.id}' references unknown tools: ${unknown.join(', ')}`)
    const only = new Set(entry.onlyTools)
    tools = tools.filter(tool => only.has(tool.name))
  }
  else {
    if (entry.toolsets?.length) {
      const toolsets = new Set(entry.toolsets)
      tools = tools.filter(tool => tool.toolset && toolsets.has(tool.toolset))
    }
    if (entry.scopes?.length) {
      const scopes = new Set(entry.scopes)
      tools = tools.filter(tool => scopes.has(tool.scope || 'read'))
    }
  }

  return tools
}

export function validateLiveCoveragePlan(entries: LiveCoveragePlanEntry[] = liveCoveragePlan): void {
  const ids = new Set<string>()
  for (const entry of entries) {
    if (ids.has(entry.id))
      throw new Error(`Duplicate live coverage plan id '${entry.id}'`)
    ids.add(entry.id)

    const plannedTools = getPlannedTools(entry)
    const plannedNames = new Set(plannedTools.map(tool => tool.name))
    const skipsWithoutReasons = Object.entries(entry.skippedTools || {})
      .filter(([, reason]) => !String(reason || '').trim())
      .map(([name]) => name)
    if (skipsWithoutReasons.length)
      throw new Error(`Live coverage plan '${entry.id}' skips must include reasons: ${skipsWithoutReasons.join(', ')}`)

    const unknownSkips = Object.keys(entry.skippedTools || {}).filter(name => !plannedNames.has(name))
    if (unknownSkips.length)
      throw new Error(`Live coverage plan '${entry.id}' skips unknown tools: ${unknownSkips.join(', ')}`)
  }

  for (const integration of listIntegrationCatalog()) {
    const integrationEntries = entries.filter(entry => entry.integrationName === integration.type)
    if (!integrationEntries.length)
      throw new Error(`Missing live coverage plan entries for '${integration.type}'`)

    const manifest = loadIntegrationManifest(integration.type)
    if (!manifest)
      throw new Error(`Missing integration manifest for '${integration.type}'`)

    const owned = new Map<string, string>()

    for (const entry of integrationEntries) {
      for (const tool of getPlannedTools(entry)) {
        const key = targetKey(entry.credentialVariant, tool.name)
        const existing = owned.get(key)
        if (existing)
          throw new Error(`Live coverage plan entries '${existing}' and '${entry.id}' both own ${integration.type}/${key}`)
        owned.set(key, entry.id)
      }
    }

    for (const tool of manifest.tools as ManifestTool[]) {
      if (tool.credentialVariants?.length) {
        for (const variant of tool.credentialVariants) {
          const key = targetKey(variant, tool.name)
          const fallbackKey = targetKey(undefined, tool.name)
          if (!owned.has(key) && !owned.has(fallbackKey))
            throw new Error(`Manifest tool '${integration.type}/${tool.name}' is not assigned to any live coverage plan for credential variant '${variant}'`)
        }
      }
      else {
        const isOwned = [...owned.keys()].some(key => key.endsWith(`:${tool.name}`))
        if (!isOwned)
          throw new Error(`Manifest tool '${integration.type}/${tool.name}' is not assigned to any live coverage plan`)
      }
    }
  }
}
