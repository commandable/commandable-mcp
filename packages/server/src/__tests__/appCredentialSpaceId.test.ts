import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('management app credential endpoints', () => {
  it('do not hardcode spaceId to local for credential store calls', () => {
    const repoRoot = resolve(__dirname, '..', '..', '..', '..')
    const files = [
      resolve(repoRoot, 'app/server/api/integrations/[id]/credentials.post.ts'),
      resolve(repoRoot, 'app/server/api/integrations/[id]/credentials-status.get.ts'),
      resolve(repoRoot, 'app/server/api/integrations/[id]/credentials.delete.ts'),
    ]

    const contents = files.map(f => readFileSync(f, 'utf8')).join('\n')
    expect(contents).not.toContain("saveCredentials('local'")
    expect(contents).not.toContain("hasCredentials('local'")
    expect(contents).not.toContain("deleteCredentials('local'")
  })
})

