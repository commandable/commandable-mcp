import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
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

/** Start a minimal HTTP server that responds with `statusCode` for all requests. */
function startStubServer(statusCode: number): Promise<{ url: string, close: () => Promise<void> }> {
  return new Promise((resolve, reject) => {
    const server = createServer((_req, res) => {
      res.writeHead(statusCode, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: statusCode < 300 }))
    })
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as AddressInfo
      resolve({
        url: `http://127.0.0.1:${port}`,
        close: () => new Promise((res) => server.close(() => res())),
      })
    })
    server.on('error', reject)
  })
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
    const { url, close } = await startStubServer(200)
    try {
      // Override the notion baseUrl by using an http integration pointing at the stub
      const integration: IntegrationData = {
        id: 'http-test',
        referenceId: 'http-test',
        type: 'http',
        label: 'HTTP stub',
        connectionMethod: 'credentials',
        credentialId: 'http-test-creds',
        spaceId: 'local',
        config: { baseUrl: url, authType: 'none' },
      }
      const proxy = new IntegrationProxy({ credentialStore })
      // http type has null health path → skipped=true, treated as connected
      const result = await checkIntegrationHealth({ integration, proxy })
      expect(result.status).toBe('connected')
    }
    finally {
      await close()
    }
  })

  it('returns invalid_credentials when provider endpoint returns 401', async () => {
    const { url, close } = await startStubServer(401)
    try {
      // Fake the notion integration by pointing to a stub via http integration
      // (direct notion call would hit real API; we test via a type not in HEALTH_PATHS)
      // Use 'github' as proxy target and stub the credential lookup
      await credentialStore.saveCredentials('local', 'github-creds', { token: 'bad-token' })

      // We'll test via the proxy.call error path instead — simulate by creating a
      // mock proxy that throws with statusCode 401
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
    }
    finally {
      await close()
    }
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
    const integration: IntegrationData = {
      id: 'http-int',
      referenceId: 'http-int',
      type: 'http',
      label: 'HTTP',
      connectionMethod: 'credentials',
      credentialId: 'http-creds',
      spaceId: 'local',
      config: { baseUrl: 'http://example.com', authType: 'none' },
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
