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

  it('uses authenticated absolute URLs when origin matches integration baseUrl', async () => {
    const credentialStore = {
      getCredentials: vi.fn(async () => ({ token: 'secret_test_token' })),
    }

    const proxy = new IntegrationProxy({ credentialStore })

    const absolutePath = 'https://api.notion.com/v1/files/attached/foo.pdf'
    const fetchSpy = vi.fn(async (url: any, init?: RequestInit) => {
      expect(String(url)).toBe(absolutePath)
      const headers = (init?.headers || {}) as Record<string, string>
      expect(headers.Authorization).toBe('Bearer secret_test_token')
      expect(headers['Notion-Version']).toBe('2022-06-28')
      return new Response('ok', {
        status: 200,
        headers: { 'content-type': 'text/plain' },
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
    }, absolutePath)

    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('rejects absolute URLs whose origin does not match integration baseUrl', async () => {
    const credentialStore = {
      getCredentials: vi.fn(async () => ({ token: 'secret_test_token' })),
    }

    const proxy = new IntegrationProxy({ credentialStore })

    const fetchSpy = vi.fn()
    globalThis.fetch = fetchSpy as any

    await expect(
      proxy.call({
        spaceId: 'local',
        id: 'notion',
        referenceId: 'notion',
        type: 'notion',
        label: 'Notion',
        connectionMethod: 'credentials',
        credentialId: 'notion-creds',
      }, 'https://evil.example.com/steal'),
    ).rejects.toThrow(/origin must match/)

    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('runs manifest-declared preprocess handlers and caches the returned token', async () => {
    const credentialStore = {
      getCredentials: vi.fn(async () => ({
        tenantId: 'tenant-123',
        clientId: 'client-123',
        clientSecret: 'secret-123',
      })),
    }

    const proxy = new IntegrationProxy({ credentialStore })

    const fetchSpy = vi.fn(async (url: any, init?: RequestInit) => {
      if (String(url).includes('login.microsoftonline.com')) {
        expect(String(init?.body || '')).toContain('grant_type=client_credentials')
        return new Response(JSON.stringify({
          access_token: 'minted-token-123',
          expires_in: 3600,
        }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      }

      const headers = (init?.headers || {}) as Record<string, string>
      expect(headers.Authorization).toBe('Bearer minted-token-123')
      return new Response(JSON.stringify({ value: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    })
    globalThis.fetch = fetchSpy as any

    const integration = {
      spaceId: 'local',
      id: 'sharepoint',
      referenceId: 'sharepoint',
      type: 'sharepoint',
      label: 'SharePoint',
      connectionMethod: 'credentials',
      credentialId: 'sharepoint-creds',
      credentialVariant: 'app_credentials',
    } as const

    await proxy.call(integration, '/sites?search=test')
    await proxy.call(integration, '/sites?search=test-2')

    expect(credentialStore.getCredentials).toHaveBeenCalledTimes(2)
    expect(fetchSpy).toHaveBeenCalledTimes(3)
    expect(String(fetchSpy.mock.calls[0]![0])).toContain('/oauth2/v2.0/token')
    expect(String(fetchSpy.mock.calls[1]![0])).toContain('graph.microsoft.com')
    expect(String(fetchSpy.mock.calls[2]![0])).toContain('graph.microsoft.com')
  })
})

