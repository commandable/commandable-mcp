import { describe, expect, it } from 'vitest'
import { validateLiveCoveragePlan } from './liveCoveragePlan.js'

describe('live coverage plan', () => {
  it('assigns every base manifest tool to live coverage or an explicit skip', () => {
    expect(() => validateLiveCoveragePlan()).not.toThrow()
  })
})
