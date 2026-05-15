import { describe, expect, it } from 'vitest'
import { loadIntegrationCredentialConfig, loadIntegrationManifest, loadIntegrationTools } from '../../../../../src/loader.ts'

describe('wise-profile manifest', () => {
  it('inherits wise provider metadata and exposes profile variant config', () => {
    const manifest = loadIntegrationManifest('wise-profile')

    expect(manifest?.name).toBe('wise')
    expect(manifest?.variantLabel).toBe('Single Profile')
    expect(manifest?.variantConfig).toEqual([
      expect.objectContaining({
        key: 'profile',
        label: 'Profile',
        selectionMode: 'single',
        listHandler: expect.any(String),
      }),
    ])
  })

  it('inherits wise credentials from the parent integration', () => {
    const credentials = loadIntegrationCredentialConfig('wise-profile')

    expect(credentials?.variantKey).toBe('personal_token')
    expect(credentials?.injection.headers).toMatchObject({
      Authorization: 'Bearer {{apiToken}}',
    })
  })

  it('injects profileId into profile-bound tools and strips it from schemas', () => {
    const tools = loadIntegrationTools('wise-profile')
    expect(tools).toBeTruthy()

    const createQuote = tools?.write.find(tool => tool.name === 'create_quote')
    const listBalances = tools?.read.find(tool => tool.name === 'list_balances')
    const listRecipients = tools?.read.find(tool => tool.name === 'list_recipients')

    for (const tool of [createQuote, listBalances, listRecipients]) {
      expect(tool?.injectFromConfig).toEqual({ profileId: 'profileId' })
      expect((tool?.inputSchema as any)?.properties?.profileId).toBeUndefined()
      expect((tool?.inputSchema as any)?.required ?? []).not.toContain('profileId')
    }
  })

  it('keeps non-profile helper tools available with their original schemas', () => {
    const tools = loadIntegrationTools('wise-profile')
    const readTools = tools?.read ?? []
    const writeTools = tools?.write ?? []

    const exchangeRate = readTools.find(tool => tool.name === 'get_exchange_rate')
    const createTransfer = writeTools.find(tool => tool.name === 'create_transfer')

    expect(exchangeRate?.inputSchema).toMatchObject({
      type: 'object',
      required: ['sourceCurrency', 'targetCurrency'],
    })
    expect(createTransfer?.inputSchema).toMatchObject({
      type: 'object',
      required: ['targetAccountId', 'quoteId'],
    })
  })

  it('excludes cross-profile discovery from the profile-scoped variant', () => {
    const tools = loadIntegrationTools('wise-profile')
    const allNames = [...(tools?.read ?? []), ...(tools?.write ?? [])].map(tool => tool.name)

    expect(allNames).not.toContain('list_profiles')
  })
})
