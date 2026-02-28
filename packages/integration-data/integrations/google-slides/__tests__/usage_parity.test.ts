import { describe, expect, it } from 'vitest'
import { getMissingToolUsages } from '../../__tests__/usageParity.js'

describe('google-slides static usage parity', () => {
  it('every manifest tool is referenced in tests', () => {
    const missing = getMissingToolUsages({ integrationName: 'google-slides', importMetaUrl: import.meta.url })
    expect(missing, `Missing handler usages in tests: ${missing.join(', ')}`).toEqual([])
  })
})
