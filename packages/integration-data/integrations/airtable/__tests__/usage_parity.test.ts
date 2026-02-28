import { describe, expect, it } from 'vitest'
import { getMissingToolUsages } from '../../__tests__/usageParity.js'

describe('airtable static usage parity', () => {
  it('every manifest tool is referenced in tests', () => {
    const missing = getMissingToolUsages({ integrationName: 'airtable', importMetaUrl: import.meta.url })
    expect(missing, `Missing handler usages in tests: ${missing.join(', ')}`).toEqual([])
  })
})
