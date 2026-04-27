import { describe, expect, it } from 'vitest'
import { getMissingToolUsages } from '../../__tests__/usageParity.js'
import { xeroLiveCoverageSkips } from './liveCoverageSkips.js'

describe('xero static usage parity', () => {
  it('every manifest tool is referenced in tests', () => {
    const missing = getMissingToolUsages({
      integrationName: 'xero',
      importMetaUrl: import.meta.url,
      skippedTools: xeroLiveCoverageSkips,
    })
    expect(missing, `Missing handler usages in tests: ${missing.join(', ')}`).toEqual([])
  })
})
