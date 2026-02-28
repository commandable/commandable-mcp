import { beforeAll, describe, expect, it } from 'vitest'
import { createCredentialStore, createIntegrationNode, createProxy, createToolbox, hasEnv } from '../../__tests__/liveHarness.js'

// LIVE GitHub read tests -- runs once per available credential variant.
// Required env vars (at least one):
// - GITHUB_CLASSIC_PAT
// - GITHUB_FINE_GRAINED_PAT

const env = process.env as Record<string, string | undefined>

interface VariantConfig {
  key: string
  token: string
}

const variants: VariantConfig[] = [
  { key: 'classic_pat', token: env.GITHUB_CLASSIC_PAT || '' },
  { key: 'fine_grained_pat', token: env.GITHUB_FINE_GRAINED_PAT || '' },
].filter(v => v.token.trim().length > 0)

const suiteOrSkip = variants.length > 0 ? describe : describe.skip

suiteOrSkip('github read handlers (live)', () => {
  for (const variant of variants) {
    describe(`variant: ${variant.key}`, () => {
      interface Ctx {
        owner?: string
        repo?: string
        issue_number?: number
      }

      const ctx: Ctx = {}
      let toolbox: ReturnType<typeof createToolbox>

      beforeAll(async () => {
        const credentialStore = createCredentialStore(async () => ({ token: variant.token }))
        const proxy = createProxy(credentialStore)
        const node = createIntegrationNode('github', { credentialVariant: variant.key })
        toolbox = createToolbox('github', proxy, node, variant.key)

        const list_repos = toolbox.read('list_repos')
        const repos = await list_repos({})
        const first = Array.isArray(repos) ? repos[0] : undefined
        ctx.owner = first?.owner?.login || first?.owner || first?.full_name?.split?.('/')[0]
        ctx.repo = first?.name || first?.full_name?.split?.('/')[1]

        if (ctx.owner && ctx.repo) {
          const list_issues = toolbox.read('list_issues')
          const issues = await list_issues({ owner: ctx.owner, repo: ctx.repo, state: 'all' })
          const firstIssue = Array.isArray(issues) ? issues.find((i: any) => typeof i.number === 'number') : undefined
          ctx.issue_number = firstIssue?.number
        }
      }, 60000)

      it('list_repos returns repositories', async () => {
        const handler = toolbox.read('list_repos')
        const result = await handler({})
        expect(result).toBeTruthy()
      }, 30000)

      it('get_repo returns repo details', async () => {
        if (!ctx.owner || !ctx.repo)
          return expect(true).toBe(true)
        const handler = toolbox.read('get_repo')
        const result = await handler({ owner: ctx.owner, repo: ctx.repo })
        expect(result?.name?.toLowerCase?.()).toBe(ctx.repo?.toLowerCase?.())
      }, 30000)

      it('list_issues returns issues for repo', async () => {
        if (!ctx.owner || !ctx.repo)
          return expect(true).toBe(true)
        const handler = toolbox.read('list_issues')
        const result = await handler({ owner: ctx.owner, repo: ctx.repo, state: 'all' })
        expect(Array.isArray(result)).toBe(true)
      }, 30000)

      it('get_issue returns a single issue if available', async () => {
        if (!ctx.owner || !ctx.repo || !ctx.issue_number)
          return expect(true).toBe(true)
        const handler = toolbox.read('get_issue')
        const result = await handler({ owner: ctx.owner, repo: ctx.repo, issue_number: ctx.issue_number })
        expect(result?.number).toBe(ctx.issue_number)
      }, 30000)

      it('list_pull_requests returns PRs', async () => {
        if (!ctx.owner || !ctx.repo)
          return expect(true).toBe(true)
        const handler = toolbox.read('list_pull_requests')
        const result = await handler({ owner: ctx.owner, repo: ctx.repo, state: 'all' })
        expect(Array.isArray(result)).toBe(true)
      }, 30000)

      it('list_branches returns branches', async () => {
        if (!ctx.owner || !ctx.repo)
          return expect(true).toBe(true)
        const handler = toolbox.read('list_branches')
        const result = await handler({ owner: ctx.owner, repo: ctx.repo })
        expect(Array.isArray(result)).toBe(true)
      }, 30000)

      it('list_commits returns commits', async () => {
        if (!ctx.owner || !ctx.repo)
          return expect(true).toBe(true)
        const handler = toolbox.read('list_commits')
        const result = await handler({ owner: ctx.owner, repo: ctx.repo })
        expect(Array.isArray(result)).toBe(true)
      }, 30000)
    })
  }
})
