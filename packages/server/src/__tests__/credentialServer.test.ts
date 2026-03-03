import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { createDb } from '../db/client.js'
import { ensureSchema } from '../db/migrate.js'
import { SqlCredentialStore } from '../db/credentialStore.js'
import { upsertIntegration, listIntegrations } from '../db/integrationStore.js'
import { startCredentialServer } from '../web/credentialServer.js'

const integrationDataDir = fileURLToPath(new URL('../../../integration-data/integrations', import.meta.url))

function makeTempSqlitePath(): string {
  const rand = Math.random().toString(16).slice(2)
  return fileURLToPath(new URL(`./tmp-credential-server-${Date.now()}-${rand}.sqlite`, import.meta.url))
}

describe('credential server', () => {
  it('serves an HTML form and saves credentials to the DB', async () => {
    process.env.COMMANDABLE_INTEGRATION_DATA_DIR = integrationDataDir

    const db = createDb({ sqlitePath: makeTempSqlitePath() })
    await ensureSchema(db)
    const store = new SqlCredentialStore(db, 'test-secret')

    const integrationId = 'integ-1'
    await upsertIntegration(db, {
      spaceId: 'local',
      id: integrationId,
      type: 'trello',
      referenceId: 'trello-test',
      label: 'Trello Test',
      enabled: true,
    } as any)

    const integrationsRef = { current: await listIntegrations(db, 'local') }

    const srv = await startCredentialServer({
      host: '127.0.0.1',
      port: 0,
      spaceId: 'local',
      db,
      credentialStore: store,
      integrationsRef,
    })

    const getResp = await fetch(`${srv.baseUrl}/credentials/${encodeURIComponent(integrationId)}`)
    expect(getResp.status).toBe(200)
    const html = await getResp.text()
    expect(html).toContain('Trello Test')
    expect(html).toContain('Save credentials')

    const postResp = await fetch(`${srv.baseUrl}/credentials/${encodeURIComponent(integrationId)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ credentialVariant: 'api_key_token', apiKey: 'k123', apiToken: 't123' }),
    })
    expect(postResp.status).toBe(200)
    const body = await postResp.json()
    expect(body.ok).toBe(true)

    const updated = (await listIntegrations(db, 'local')).find(i => i.id === integrationId)!
    expect(updated.connectionMethod).toBe('credentials')
    expect(updated.credentialId).toBeTruthy()
    expect(await store.hasCredentials('local', updated.credentialId!)).toBe(true)

    // in-memory integration list ref gets refreshed
    expect(integrationsRef.current.find(i => i.id === integrationId)?.connectionMethod).toBe('credentials')

    await srv.close()
    db.close()
  })
})

