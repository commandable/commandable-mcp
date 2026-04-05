import { describe, expect, it } from 'vitest'
import { getMissingToolUsages } from '../../__tests__/usageParity.js'

describe('sharepoint static usage parity', () => {
  it('every bearer_token tool is referenced in tests', () => {
    const missing = getMissingToolUsages({
      integrationName: 'sharepoint',
      importMetaUrl: import.meta.url,
      credentialVariant: 'bearer_token',
    })
    expect(missing, `Missing handler usages in tests: ${missing.join(', ')}`).toEqual([])
  })
})
