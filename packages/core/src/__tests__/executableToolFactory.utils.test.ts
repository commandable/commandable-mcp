import { describe, expect, it } from 'vitest'
import { createSafeHandlerFromString } from '../integrations/sandbox.js'
import { buildSandboxUtils, resolveSandboxUtils } from '../integrations/sandboxUtils.js'

describe('resolveSandboxUtils', () => {
  it('uses inject only when defined (no manifest bundle merge)', () => {
    const injected = { extractFileContent: async () => ({ kind: 'text', content: 'hello' }) }
    const resolved = resolveSandboxUtils(['html'], injected)
    expect(resolved).toBe(injected)
    expect((resolved as any).html).toBeUndefined()
  })

  it('uses buildSandboxUtils bundles when inject is undefined', () => {
    const resolved = resolveSandboxUtils(['html'], undefined)
    expect((resolved as any).html).toBeDefined()
    expect((resolved as any).extractFileContent).toBeUndefined()
  })

  it('empty inject object replaces entirely (host owns full utils)', () => {
    const resolved = resolveSandboxUtils(['html'], {})
    expect(Object.keys(resolved)).toHaveLength(0)
  })

  it('allows handler to call utils from inject-only object', async () => {
    const utils = resolveSandboxUtils(undefined, {
      myFn: async (x: number) => x * 2,
    })
    const handler = createSafeHandlerFromString(
      `async () => { return await utils.myFn(21); }`,
      () => ({}),
      utils,
    )
    const out = await handler({})
    expect(out.success).toBe(true)
    expect(out.result).toBe(42)
  })

  it('app can compose buildSandboxUtils with custom keys manually', () => {
    const base = buildSandboxUtils(['html']) as Record<string, unknown>
    const composed = { ...base, custom: () => 'ok' }
    expect((composed as any).html).toBeDefined()
    expect((composed as any).custom()).toBe('ok')
  })
})
