import { fileURLToPath } from 'node:url'
import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { checkIntegrationHealth } from '../integrations/health.js'
import { IntegrationProxy } from '../integrations/proxy.js'
import { createDb } from '../db/client.js'
import { ensureSchema } from '../db/migrate.js'
import { updateIntegrationHealth } from '../db/integrationStore.js'
import { SqlCredentialStore } from '../db/credentialStore.js'
import type { IntegrationData } from '../types.js'

const integrationDataDir = fileURLToPath(new URL('../../../integration-data/integrations', import.meta.url))

function makeTempSqlitePath(): string {
  const rand = Math.random().toString(16).slice(2)
  return fileURLToPath(new URL(`./tmp-health-${Date.now()}-${rand}.sqlite`, import.meta.url))
}

function makeNotionIntegration(overrides: Partial<IntegrationData> = {}): IntegrationData {
  return {
    id: 'test-notion-id',
    referenceId: 'notion-test',
    type: 'notion',
    label: 'Test Notion',
    connectionMethod: 'credentials',
    credentialId: 'notion-test-creds',
    spaceId: 'local',
    ...overrides,
  }
}

describe('checkIntegrationHealth', () => {
  let db: any
  let credentialStore: SqlCredentialStore

  beforeEach(async () => {
    process.env.COMMANDABLE_INTEGRATION_DATA_DIR = integrationDataDir
    db = createDb({ sqlitePath: makeTempSqlitePath() })
    await ensureSchema(db)
    credentialStore = new SqlCredentialStore(db, 'test-secret')
    await credentialStore.saveCredentials('local', 'notion-test-creds', { token: 'test-token' })
  })

  afterEach(() => {
    db.close()
  })

  it('returns connected when provider endpoint returns 2xx', async () => {
    const mockProxy = {
      call: async () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
    } as any

    const integration = makeNotionIntegration()
    const result = await checkIntegrationHealth({ integration, proxy: mockProxy })
    expect(result.status).toBe('connected')
    expect(result.skipped).toBeFalsy()
  })

  it('returns invalid_credentials when provider endpoint returns 401', async () => {
    const mockProxy = {
      call: async () => {
        const err: any = new Error('Authentication failed.')
        err.statusCode = 401
        throw err
      },
    } as any

    const integration = makeNotionIntegration()
    const result = await checkIntegrationHealth({ integration, proxy: mockProxy })
    expect(result.status).toBe('invalid_credentials')
  })

  it('returns disconnected when no credentials are configured', async () => {
    const integration = makeNotionIntegration({ credentialId: 'notion-missing-creds' })

    const mockProxy = {
      call: async () => {
        const err: any = new Error('No credentials are configured for this integration.')
        err.statusCode = 400
        throw err
      },
    } as any

    const result = await checkIntegrationHealth({ integration, proxy: mockProxy })
    expect(result.status).toBe('disconnected')
  })

  it('returns connected (skipped) for providers without a health endpoint', async () => {
    // google-sheet explicitly marks health checks as not viable, so health is skipped
    const integration: IntegrationData = {
      id: 'gsheet-test',
      referenceId: 'gsheet-test',
      type: 'google-sheet',
      label: 'Google Sheets',
      connectionMethod: 'credentials',
      credentialId: 'gsheet-test-creds',
      spaceId: 'local',
    }
    const proxy = new IntegrationProxy({ credentialStore })
    const result = await checkIntegrationHealth({ integration, proxy })
    expect(result.status).toBe('connected')
    expect(result.skipped).toBe(true)
  })
})

describe('updateIntegrationHealth', () => {
  let db: any

  beforeEach(async () => {
    db = createDb({ sqlitePath: makeTempSqlitePath() })
    await ensureSchema(db)
  })

  afterEach(() => {
    db.close()
  })

  it('persists health_status and health_checked_at for an integration', async () => {
    const { upsertIntegration, listIntegrations } = await import('../db/integrationStore.js')

    const integration: IntegrationData = {
      id: 'test-id',
      referenceId: 'test-ref',
      type: 'notion',
      label: 'Test',
      spaceId: 'local',
    }
    await upsertIntegration(db, integration)

    const checkedAt = new Date()
    await updateIntegrationHealth(db, 'test-id', 'connected', checkedAt)

    const results = await listIntegrations(db, 'local')
    const found = results.find(r => r.id === 'test-id')
    expect(found?.healthStatus).toBe('connected')
    expect(found?.healthCheckedAt?.getTime()).toBeCloseTo(checkedAt.getTime(), -3)
  })

  it('can set invalid_credentials status', async () => {
    const { upsertIntegration, listIntegrations } = await import('../db/integrationStore.js')

    const integration: IntegrationData = {
      id: 'test-id-2',
      referenceId: 'test-ref-2',
      type: 'github',
      label: 'Test GH',
      spaceId: 'local',
    }
    await upsertIntegration(db, integration)
    await updateIntegrationHealth(db, 'test-id-2', 'invalid_credentials')

    const results = await listIntegrations(db, 'local')
    const found = results.find(r => r.id === 'test-id-2')
    expect(found?.healthStatus).toBe('invalid_credentials')
  })

  it('can set disconnected status', async () => {
    const { upsertIntegration, listIntegrations } = await import('../db/integrationStore.js')

    const integration: IntegrationData = {
      id: 'test-id-3',
      referenceId: 'test-ref-3',
      type: 'github',
      label: 'Test GH3',
      spaceId: 'local',
      healthStatus: 'connected',
    }
    await upsertIntegration(db, integration)
    await updateIntegrationHealth(db, 'test-id-3', 'disconnected')

    const results = await listIntegrations(db, 'local')
    const found = results.find(r => r.id === 'test-id-3')
    expect(found?.healthStatus).toBe('disconnected')
  })
})
