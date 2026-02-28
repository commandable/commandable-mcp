import { describe, expect, it } from 'vitest'
import { getMissingToolUsages } from '../../__tests__/usageParity.js'

describe('github static usage parity', () => {
  it('every classic_pat tool is referenced in tests', () => {
    const missing = getMissingToolUsages({
      integrationName: 'github',
      importMetaUrl: import.meta.url,
      credentialVariant: 'classic_pat',
    })
    expect(missing, `Missing handler usages in tests: ${missing.join(', ')}`).toEqual([])
  })

  it('every fine_grained_pat tool is referenced in tests', () => {
    const missing = getMissingToolUsages({
      integrationName: 'github',
      importMetaUrl: import.meta.url,
      credentialVariant: 'fine_grained_pat',
    })
    expect(missing, `Missing handler usages in tests: ${missing.join(', ')}`).toEqual([])
  })
})
