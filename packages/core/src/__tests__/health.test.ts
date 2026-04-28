import { fileURLToPath } from 'node:url'
import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { checkIntegrationHealth } from '../integrations/health.js'
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

  it('runs the concrete Google Workspace health endpoint', async () => {
    const integration: IntegrationData = {
      id: 'gworkspace-test',
      referenceId: 'gworkspace-test',
      type: 'google-workspace',
      label: 'Google Workspace',
      connectionMethod: 'credentials',
      credentialId: 'gworkspace-test-creds',
      spaceId: 'local',
    }
    const calls: Array<{ path: string, init: RequestInit }> = []
    const proxy = {
      call: async (_integration: IntegrationData, path: string, init: RequestInit) => {
        calls.push({ path, init })
        return new Response(JSON.stringify({ user: { emailAddress: 'test@example.com' } }), { status: 200 })
      },
    } as any

    const result = await checkIntegrationHealth({ integration, proxy })
    expect(result.status).toBe('connected')
    expect(result.skipped).toBeFalsy()
    expect(calls).toEqual([{ path: 'https://www.googleapis.com/drive/v3/about?fields=user', init: { method: 'GET', headers: undefined } }])
  })

  it('runs the concrete SharePoint app-credential health endpoint', async () => {
    const integration: IntegrationData = {
      id: 'sharepoint-test',
      referenceId: 'sharepoint-test',
      type: 'sharepoint',
      label: 'SharePoint',
      connectionMethod: 'credentials',
      credentialId: 'sharepoint-test-creds',
      credentialVariant: 'app_credentials',
      spaceId: 'local',
    }
    const calls: Array<{ path: string, init: RequestInit }> = []
    const proxy = {
      call: async (_integration: IntegrationData, path: string, init: RequestInit) => {
        calls.push({ path, init })
        return new Response(JSON.stringify({ value: [] }), { status: 200 })
      },
    } as any

    const result = await checkIntegrationHealth({ integration, proxy })
    expect(result.status).toBe('connected')
    expect(result.skipped).toBeFalsy()
    expect(calls).toEqual([{ path: '/sites?search=*&$top=1', init: { method: 'GET', headers: undefined } }])
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

  it('stores integration config objects in sqlite', async () => {
    const { upsertIntegration, listIntegrations } = await import('../db/integrationStore.js')

    const integration: IntegrationData = {
      id: 'test-id-4',
      referenceId: 'test-ref-4',
      type: 'trello-board',
      label: 'Scoped Trello',
      spaceId: 'local',
      config: {
        boardId: 'board-123',
        boardName: 'Roadmap',
      },
    }

    await upsertIntegration(db, integration)

    const results = await listIntegrations(db, 'local')
    const found = results.find(r => r.id === 'test-id-4')
    expect(found?.config).toEqual({
      boardId: 'board-123',
      boardName: 'Roadmap',
    })
  })
})
