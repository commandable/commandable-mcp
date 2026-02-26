import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { IntegrationProxy } from '../integrations/proxy.js'

describe('IntegrationProxy credentials injection', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('injects headers from credentials.json (notion)', async () => {
    const credentialStore = {
      getCredentials: vi.fn(async () => ({ token: 'secret_test_token' })),
    }

    const proxy = new IntegrationProxy({ credentialStore })

    const fetchSpy = vi.fn(async (_url: any, init?: RequestInit) => {
      const headers = (init?.headers || {}) as Record<string, string>
      expect(headers.Authorization).toBe('Bearer secret_test_token')
      expect(headers['Notion-Version']).toBe('2022-06-28')
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    })
    globalThis.fetch = fetchSpy as any

    await proxy.call({
      spaceId: 'local',
      id: 'notion',
      referenceId: 'notion',
      type: 'notion',
      label: 'Notion',
      connectionMethod: 'credentials',
      credentialId: 'notion-creds',
    }, '/users/me')

    expect(credentialStore.getCredentials).toHaveBeenCalledWith('local', 'notion-creds')
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('injects query params from credentials.json (trello)', async () => {
    const credentialStore = {
      getCredentials: vi.fn(async () => ({ apiKey: 'k_test', apiToken: 't_test' })),
    }

    const proxy = new IntegrationProxy({ credentialStore })

    const fetchSpy = vi.fn(async (url: any) => {
      const u = String(url)
      expect(u).toContain('key=k_test')
      expect(u).toContain('token=t_test')
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    })
    globalThis.fetch = fetchSpy as any

    await proxy.call({
      spaceId: 'local',
      id: 'trello',
      referenceId: 'trello',
      type: 'trello',
      label: 'Trello',
      connectionMethod: 'credentials',
      credentialId: 'trello-creds',
    }, '/members/me/boards?fields=id')

    expect(credentialStore.getCredentials).toHaveBeenCalledWith('local', 'trello-creds')
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })
})

