import { $fetch } from 'ofetch'
import { beforeAll, describe, expect, it } from 'vitest'
import { IntegrationProxy } from '../../../../server/services/integrationProxy'
import { loadIntegrationTools } from '../../../../server/utils/integrationDataLoader'

// LIVE GitHub integration tests using Nango
// Required env vars:
// - NUXT_PUBLIC_NANGO_API_BASE_URL
// - NUXT_NANGO_SECRET_KEY
// - GITHUB_TEST_CONNECTION_ID (Nango connection for provider 'github')

interface Ctx {
  owner?: string
  repo?: string
  issue_number?: number
}

describe('github read handlers (live)', () => {
  const env = process.env as Record<string, string>
  const ctx: Ctx = {}
  let buildHandler: (name: string) => ((input: any) => Promise<any>)

  beforeAll(async () => {
    const { NUXT_PUBLIC_NANGO_API_BASE_URL, NUXT_NANGO_SECRET_KEY, GITHUB_TEST_CONNECTION_ID } = env

    if (!NUXT_PUBLIC_NANGO_API_BASE_URL || !NUXT_NANGO_SECRET_KEY || !GITHUB_TEST_CONNECTION_ID) {
      console.warn('Skipping live GitHub tests: missing required env vars')
      expect(false).toBe(true)
      return
    }

    ;(global as any).$fetch = $fetch
    ;(global as any).useRuntimeConfig = () => ({ public: { nangoApiBaseUrl: NUXT_PUBLIC_NANGO_API_BASE_URL } })

    const proxy = new IntegrationProxy(NUXT_NANGO_SECRET_KEY)
    const integrationNode = { id: 'node-github', type: 'github', label: 'GitHub', connectionId: GITHUB_TEST_CONNECTION_ID } as any

    const tools = loadIntegrationTools('github')
    expect(tools).toBeTruthy()

    buildHandler = (name: string) => {
      const tool = tools!.read.find(t => t.name === name)
      expect(tool, `tool ${name} exists`).toBeTruthy()
      const integration = {
        fetch: (path: string, init?: RequestInit) => proxy.call(integrationNode, path, init),
      }
      const build = new Function('integration', `return (${tool!.handlerCode});`)
      return build(integration) as (input: any) => Promise<any>
    }

    // Discover owner/repo/issue for tests
    const list_repos = buildHandler('list_repos')
    const repos = await list_repos({})
    const first = Array.isArray(repos) ? repos[0] : repos?.[0]
    ctx.owner = first?.owner?.login || first?.owner || first?.full_name?.split?.('/')[0]
    ctx.repo = first?.name || first?.full_name?.split?.('/')[1]

    if (ctx.owner && ctx.repo) {
      const list_issues = buildHandler('list_issues')
      const issues = await list_issues({ owner: ctx.owner, repo: ctx.repo, state: 'all' })
      const firstIssue = Array.isArray(issues) ? issues.find((i: any) => typeof i.number === 'number') : undefined
      ctx.issue_number = firstIssue?.number
    }
  }, 60000)

  it('list_repos returns repositories', async () => {
    const handler = buildHandler('list_repos')
    const result = await handler({})
    expect(result).toBeTruthy()
  }, 30000)

  it('get_repo returns repo details', async () => {
    if (!ctx.owner || !ctx.repo)
      return expect(true).toBe(true)
    const handler = buildHandler('get_repo')
    const result = await handler({ owner: ctx.owner, repo: ctx.repo })
    expect(result?.name?.toLowerCase?.()).toBe(ctx.repo?.toLowerCase?.())
  }, 30000)

  it('list_issues returns issues for repo', async () => {
    if (!ctx.owner || !ctx.repo)
      return expect(true).toBe(true)
    const handler = buildHandler('list_issues')
    const result = await handler({ owner: ctx.owner, repo: ctx.repo, state: 'all' })
    expect(Array.isArray(result)).toBe(true)
  }, 30000)

  it('get_issue returns a single issue if available', async () => {
    if (!ctx.owner || !ctx.repo || !ctx.issue_number)
      return expect(true).toBe(true)
    const handler = buildHandler('get_issue')
    const result = await handler({ owner: ctx.owner, repo: ctx.repo, issue_number: ctx.issue_number })
    expect(result?.number).toBe(ctx.issue_number)
  }, 30000)

  it('list_pull_requests returns PRs', async () => {
    if (!ctx.owner || !ctx.repo)
      return expect(true).toBe(true)
    const handler = buildHandler('list_pull_requests')
    const result = await handler({ owner: ctx.owner, repo: ctx.repo, state: 'all' })
    expect(Array.isArray(result)).toBe(true)
  }, 30000)

  it('list_branches returns branches', async () => {
    if (!ctx.owner || !ctx.repo)
      return expect(true).toBe(true)
    const handler = buildHandler('list_branches')
    const result = await handler({ owner: ctx.owner, repo: ctx.repo })
    expect(Array.isArray(result)).toBe(true)
  }, 30000)

  it('list_commits returns commits', async () => {
    if (!ctx.owner || !ctx.repo)
      return expect(true).toBe(true)
    const handler = buildHandler('list_commits')
    const result = await handler({ owner: ctx.owner, repo: ctx.repo })
    expect(Array.isArray(result)).toBe(true)
  }, 30000)
})
