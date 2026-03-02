import { describe, expect, it } from 'vitest'
import { getMissingToolUsages } from '../../__tests__/usageParity.js'

describe('confluence static usage parity', () => {
  it('every api_token tool is referenced in tests', () => {
    const missing = getMissingToolUsages({
      integrationName: 'confluence',
      importMetaUrl: import.meta.url,
      credentialVariant: 'api_token',
    })
    expect(missing, `Missing handler usages in tests: ${missing.join(', ')}`).toEqual([])
  })
})

