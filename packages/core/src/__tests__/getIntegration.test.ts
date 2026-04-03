import { describe, expect, it, vi } from 'vitest'
import { createGetIntegration } from '../integrations/getIntegration.js'

describe('createGetIntegration', () => {
  const proxy = {
    call: vi.fn(),
  } as any

  it('resolves exact integration ids and exposes metadata', () => {
    const getIntegration = createGetIntegration([{
      id: 'integration-123',
      referenceId: 'google_workspace_primary',
      type: 'google-workspace',
      label: 'Google Workspace',
      connectionMethod: 'credentials',
      credentialId: 'credential-123',
    } as any], proxy)

    const integration = getIntegration('integration-123')

    expect(integration.id).toBe('integration-123')
    expect(integration.referenceId).toBe('google_workspace_primary')
    expect(integration.type).toBe('google-workspace')
    expect(integration.label).toBe('Google Workspace')
  })

  it('resolves exact reference ids', () => {
    const getIntegration = createGetIntegration([{
      id: 'integration-123',
      referenceId: 'google_workspace_primary',
      type: 'google-workspace',
      label: 'Google Workspace',
      connectionMethod: 'credentials',
      credentialId: 'credential-123',
    } as any], proxy)

    const integration = getIntegration('google_workspace_primary')

    expect(integration.id).toBe('integration-123')
  })

  it('rejects provider type lookups', () => {
    const getIntegration = createGetIntegration([{
      id: 'integration-123',
      referenceId: 'google_workspace_primary',
      type: 'google-workspace',
      label: 'Google Workspace',
      connectionMethod: 'credentials',
      credentialId: 'credential-123',
    } as any], proxy)

    expect(() => getIntegration('google-workspace')).toThrow('Invalid or unauthorized integration reference/id')
  })
})
