import { describe, expect, it } from 'vitest'
import { loadIntegrationManifest } from '../../../src/loader.js'
import { wiseLiveCoverageSkips } from './liveCoverageSkips.js'

describe('wise usage parity', () => {
  it('only skips manifest tools that are explicitly not safe to run repeatedly', () => {
    const manifest = loadIntegrationManifest('wise')
    expect(manifest).toBeTruthy()

    const toolNames = new Set((manifest?.tools || []).map(tool => tool.name))
    const skippedNames = Object.keys(wiseLiveCoverageSkips)

    expect(skippedNames.length).toBeGreaterThan(0)
    expect(skippedNames.filter(name => !toolNames.has(name))).toEqual([])
    expect(skippedNames).not.toContain('send_money')
    expect(skippedNames).not.toContain('move_money_between_balances')
  })
})
