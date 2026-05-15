import { describe, expect, it } from 'vitest'
import { checkIntegrationHealth } from '../../../core/src/integrations/health.js'
import { createCredentialStore, createIntegrationNode, createProxy, hasEnv } from './liveHarness.js'

const env = process.env as Record<string, string | undefined>

interface HealthCheckCase {
  label: string
  type: string
  credentialVariant?: string
  credentials: () => Record<string, string>
  enabled: boolean
}

const cases: HealthCheckCase[] = [
  {
    label: 'airtable/personal_access_token',
    type: 'airtable',
    credentials: () => ({ token: env.AIRTABLE_TOKEN || '' }),
    enabled: hasEnv('AIRTABLE_TOKEN'),
  },
  {
    label: 'confluence/api_token',
    type: 'confluence',
    credentials: () => ({
      domain: env.CONFLUENCE_DOMAIN || '',
      email: env.CONFLUENCE_EMAIL || '',
      apiToken: env.CONFLUENCE_API_TOKEN || '',
    }),
    enabled: hasEnv('CONFLUENCE_DOMAIN', 'CONFLUENCE_EMAIL', 'CONFLUENCE_API_TOKEN'),
  },
  {
    label: 'github/classic_pat',
    type: 'github',
    credentialVariant: 'classic_pat',
    credentials: () => ({ token: env._GITHUB_CLASSIC_PAT || '' }),
    enabled: hasEnv('_GITHUB_CLASSIC_PAT'),
  },
  {
    label: 'github/fine_grained_pat',
    type: 'github',
    credentialVariant: 'fine_grained_pat',
    credentials: () => ({ token: env._GITHUB_FINE_GRAINED_PAT || '' }),
    enabled: hasEnv('_GITHUB_FINE_GRAINED_PAT'),
  },
  {
    label: 'google-calendar/service_account',
    type: 'google-calendar',
    credentialVariant: 'service_account',
    credentials: () => ({
      serviceAccountJson: env.GOOGLE_SERVICE_ACCOUNT_JSON || '',
      subject: env.GOOGLE_IMPERSONATE_SUBJECT || '',
    }),
    enabled: hasEnv('GOOGLE_SERVICE_ACCOUNT_JSON', 'GOOGLE_IMPERSONATE_SUBJECT'),
  },
  {
    label: 'google-calendar/oauth_token',
    type: 'google-calendar',
    credentialVariant: 'oauth_token',
    credentials: () => ({ token: env.GOOGLE_TOKEN || '' }),
    enabled: hasEnv('GOOGLE_TOKEN'),
  },
  {
    label: 'google-gmail/service_account',
    type: 'google-gmail',
    credentialVariant: 'service_account',
    credentials: () => ({
      serviceAccountJson: env.GOOGLE_SERVICE_ACCOUNT_JSON || '',
      subject: env.GOOGLE_IMPERSONATE_SUBJECT || '',
    }),
    enabled: hasEnv('GOOGLE_SERVICE_ACCOUNT_JSON', 'GOOGLE_IMPERSONATE_SUBJECT'),
  },
  {
    label: 'google-gmail/oauth_token',
    type: 'google-gmail',
    credentialVariant: 'oauth_token',
    credentials: () => ({ token: env.GOOGLE_TOKEN || '' }),
    enabled: hasEnv('GOOGLE_TOKEN'),
  },
  {
    label: 'google-workspace/service_account',
    type: 'google-workspace',
    credentialVariant: 'service_account',
    credentials: () => ({
      serviceAccountJson: env.GOOGLE_SERVICE_ACCOUNT_JSON || '',
      subject: env.GOOGLE_IMPERSONATE_SUBJECT || '',
    }),
    enabled: hasEnv('GOOGLE_SERVICE_ACCOUNT_JSON'),
  },
  {
    label: 'google-workspace/oauth_token',
    type: 'google-workspace',
    credentialVariant: 'oauth_token',
    credentials: () => ({ token: env.GOOGLE_TOKEN || '' }),
    enabled: hasEnv('GOOGLE_TOKEN'),
  },
  {
    label: 'hubspot/private_app_token',
    type: 'hubspot',
    credentials: () => ({ token: env.HUBSPOT_TOKEN || '' }),
    enabled: hasEnv('HUBSPOT_TOKEN'),
  },
  {
    label: 'jira/api_token',
    type: 'jira',
    credentials: () => ({
      domain: env.JIRA_DOMAIN || '',
      email: env.JIRA_EMAIL || '',
      apiToken: env.JIRA_API_TOKEN || '',
    }),
    enabled: hasEnv('JIRA_DOMAIN', 'JIRA_EMAIL', 'JIRA_API_TOKEN'),
  },
  {
    label: 'notion/internal_integration_token',
    type: 'notion',
    credentials: () => ({ token: env.NOTION_TOKEN || '' }),
    enabled: hasEnv('NOTION_TOKEN'),
  },
  {
    label: 'sharepoint/app_credentials',
    type: 'sharepoint',
    credentialVariant: 'app_credentials',
    credentials: () => ({
      tenantId: env.SHAREPOINT_TENANT_ID || '',
      clientId: env.SHAREPOINT_CLIENT_ID || '',
      clientSecret: env.SHAREPOINT_CLIENT_SECRET || '',
    }),
    enabled: hasEnv('SHAREPOINT_TENANT_ID', 'SHAREPOINT_CLIENT_ID', 'SHAREPOINT_CLIENT_SECRET'),
  },
  {
    label: 'trello/api_key',
    type: 'trello',
    credentials: () => ({
      apiKey: env.TRELLO_API_KEY || '',
      apiToken: env.TRELLO_API_TOKEN || '',
    }),
    enabled: hasEnv('TRELLO_API_KEY', 'TRELLO_API_TOKEN'),
  },
  {
    label: 'wise/personal_token_sandbox',
    type: 'wise',
    credentialVariant: 'personal_token_sandbox',
    credentials: () => ({ apiToken: env.WISE_SANDBOX_API_TOKEN || '' }),
    enabled: hasEnv('WISE_SANDBOX_API_TOKEN'),
  },
  {
    label: 'xero/custom_connection',
    type: 'xero',
    credentialVariant: 'custom_connection',
    credentials: () => ({
      clientId: env.XERO_CLIENT_ID || '',
      clientSecret: env.XERO_CLIENT_SECRET || '',
    }),
    enabled: hasEnv('XERO_CLIENT_ID', 'XERO_CLIENT_SECRET'),
  },
]

const availableCases = cases.filter(testCase => testCase.enabled)
const suiteOrSkip = availableCases.length ? describe : describe.skip

suiteOrSkip('credential health checks (live)', () => {
  it.each(availableCases)('$label returns connected through the health runner', async (testCase) => {
    const credentialStore = createCredentialStore(async () => testCase.credentials())
    const proxy = createProxy(credentialStore)
    const integration = createIntegrationNode(testCase.type, {
      label: testCase.label,
      credentialId: `${testCase.type}-${testCase.credentialVariant || 'default'}-health-creds`,
      credentialVariant: testCase.credentialVariant,
    })

    const result = await checkIntegrationHealth({ integration, proxy })
    expect(result.status, result.message).toBe('connected')
    expect(result.skipped, result.message).toBeFalsy()
  })
})
