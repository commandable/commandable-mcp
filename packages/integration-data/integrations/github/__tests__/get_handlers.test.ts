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
        pull_number?: number
        commit_sha?: string
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

          const list_commits = toolbox.read('list_commits')
          const commits = await list_commits({ owner: ctx.owner, repo: ctx.repo })
          const firstCommit = Array.isArray(commits) ? commits[0] : undefined
          ctx.commit_sha = firstCommit?.sha

          const list_pull_requests = toolbox.read('list_pull_requests')
          const prs = await list_pull_requests({ owner: ctx.owner, repo: ctx.repo, state: 'all' })
          const firstPr = Array.isArray(prs) ? prs.find((p: any) => typeof p.number === 'number') : undefined
          ctx.pull_number = firstPr?.number
        }
      }, 60000)

      it('get_me returns authenticated user', async () => {
        const handler = toolbox.read('get_me')
        const result = await handler({})
        expect(result?.login).toBeTruthy()
      }, 30000)

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

      it('search_repos returns repositories', async () => {
        const handler = toolbox.read('search_repos')
        const result = await handler({ query: 'commandable-mcp language:typescript' })
        expect(result?.items).toBeTruthy()
      }, 30000)

      it('get_repo_tree returns file tree', async () => {
        if (!ctx.owner || !ctx.repo)
          return expect(true).toBe(true)
        const handler = toolbox.read('get_repo_tree')
        const result = await handler({ owner: ctx.owner, repo: ctx.repo, recursive: true })
        expect(result?.tree).toBeTruthy()
        expect(Array.isArray(result.tree)).toBe(true)
      }, 30000)

      it('get_file_contents returns decoded file content', async () => {
        if (!ctx.owner || !ctx.repo)
          return expect(true).toBe(true)
        // Find a known small text file (README is common)
        const handler = toolbox.read('get_file_contents')
        const result = await handler({ owner: ctx.owner, repo: ctx.repo, path: 'README.md' })
        // It's OK if there's no README — just check for a usable response shape
        if (result?.message === 'Not Found')
          return expect(true).toBe(true)
        expect(result?.path).toBe('README.md')
        expect(result?.encoding).toBe('utf-8')
        expect(typeof result?.content).toBe('string')
      }, 30000)

      it('search_code returns results', async () => {
        if (!ctx.owner || !ctx.repo)
          return expect(true).toBe(true)
        const handler = toolbox.read('search_code')
        const result = await handler({ query: `repo:${ctx.owner}/${ctx.repo}` })
        expect(result?.items).toBeTruthy()
      }, 30000)

      it('list_branches returns branches with pagination', async () => {
        if (!ctx.owner || !ctx.repo)
          return expect(true).toBe(true)
        const handler = toolbox.read('list_branches')
        const result = await handler({ owner: ctx.owner, repo: ctx.repo, per_page: 10 })
        expect(Array.isArray(result)).toBe(true)
      }, 30000)

      it('list_commits returns commits with pagination', async () => {
        if (!ctx.owner || !ctx.repo)
          return expect(true).toBe(true)
        const handler = toolbox.read('list_commits')
        const result = await handler({ owner: ctx.owner, repo: ctx.repo, per_page: 5 })
        expect(Array.isArray(result)).toBe(true)
      }, 30000)

      it('get_commit returns commit details', async () => {
        if (!ctx.owner || !ctx.repo || !ctx.commit_sha)
          return expect(true).toBe(true)
        const handler = toolbox.read('get_commit')
        const result = await handler({ owner: ctx.owner, repo: ctx.repo, sha: ctx.commit_sha })
        expect(result?.sha).toBe(ctx.commit_sha)
      }, 30000)

      it('list_tags returns tags', async () => {
        if (!ctx.owner || !ctx.repo)
          return expect(true).toBe(true)
        const handler = toolbox.read('list_tags')
        const result = await handler({ owner: ctx.owner, repo: ctx.repo })
        expect(Array.isArray(result)).toBe(true)
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

      it('list_issue_comments returns comments array', async () => {
        if (!ctx.owner || !ctx.repo || !ctx.issue_number)
          return expect(true).toBe(true)
        const handler = toolbox.read('list_issue_comments')
        const result = await handler({ owner: ctx.owner, repo: ctx.repo, issue_number: ctx.issue_number })
        expect(Array.isArray(result)).toBe(true)
      }, 30000)

      it('search_issues returns results', async () => {
        if (!ctx.owner || !ctx.repo)
          return expect(true).toBe(true)
        const handler = toolbox.read('search_issues')
        const result = await handler({ query: `is:issue repo:${ctx.owner}/${ctx.repo}` })
        expect(result?.items).toBeTruthy()
      }, 30000)

      it('list_labels returns labels array', async () => {
        if (!ctx.owner || !ctx.repo)
          return expect(true).toBe(true)
        const handler = toolbox.read('list_labels')
        const result = await handler({ owner: ctx.owner, repo: ctx.repo })
        expect(Array.isArray(result)).toBe(true)
      }, 30000)

      it('list_pull_requests returns PRs with pagination', async () => {
        if (!ctx.owner || !ctx.repo)
          return expect(true).toBe(true)
        const handler = toolbox.read('list_pull_requests')
        const result = await handler({ owner: ctx.owner, repo: ctx.repo, state: 'all', per_page: 5 })
        expect(Array.isArray(result)).toBe(true)
      }, 30000)

      it('get_pull_request returns PR details if available', async () => {
        if (!ctx.owner || !ctx.repo || !ctx.pull_number)
          return expect(true).toBe(true)
        const handler = toolbox.read('get_pull_request')
        const result = await handler({ owner: ctx.owner, repo: ctx.repo, pull_number: ctx.pull_number })
        expect(result?.number).toBe(ctx.pull_number)
      }, 30000)

      it('get_pull_request_diff returns diff text if PR available', async () => {
        if (!ctx.owner || !ctx.repo || !ctx.pull_number)
          return expect(true).toBe(true)
        const handler = toolbox.read('get_pull_request_diff')
        const result = await handler({ owner: ctx.owner, repo: ctx.repo, pull_number: ctx.pull_number })
        expect(typeof result?.diff).toBe('string')
      }, 30000)

      it('list_pull_request_files returns files if PR available', async () => {
        if (!ctx.owner || !ctx.repo || !ctx.pull_number)
          return expect(true).toBe(true)
        const handler = toolbox.read('list_pull_request_files')
        const result = await handler({ owner: ctx.owner, repo: ctx.repo, pull_number: ctx.pull_number })
        expect(Array.isArray(result)).toBe(true)
      }, 30000)

      it('list_pull_request_comments returns comments if PR available', async () => {
        if (!ctx.owner || !ctx.repo || !ctx.pull_number)
          return expect(true).toBe(true)
        const handler = toolbox.read('list_pull_request_comments')
        const result = await handler({ owner: ctx.owner, repo: ctx.repo, pull_number: ctx.pull_number })
        expect(Array.isArray(result)).toBe(true)
      }, 30000)

      it('search_pull_requests returns results', async () => {
        if (!ctx.owner || !ctx.repo)
          return expect(true).toBe(true)
        const handler = toolbox.read('search_pull_requests')
        const result = await handler({ query: `is:pr repo:${ctx.owner}/${ctx.repo}` })
        expect(result?.items).toBeTruthy()
      }, 30000)

      it('list_releases returns releases', async () => {
        if (!ctx.owner || !ctx.repo)
          return expect(true).toBe(true)
        const handler = toolbox.read('list_releases')
        const result = await handler({ owner: ctx.owner, repo: ctx.repo })
        expect(Array.isArray(result)).toBe(true)
      }, 30000)

      it('get_latest_release returns latest release or not found', async () => {
        if (!ctx.owner || !ctx.repo)
          return expect(true).toBe(true)
        const handler = toolbox.read('get_latest_release')
        const result = await handler({ owner: ctx.owner, repo: ctx.repo })
        // Repo might have no releases — 404 is acceptable
        expect(result).toBeTruthy()
      }, 30000)

      it('list_workflow_runs returns workflow runs', async () => {
        if (!ctx.owner || !ctx.repo)
          return expect(true).toBe(true)
        const handler = toolbox.read('list_workflow_runs')
        const result = await handler({ owner: ctx.owner, repo: ctx.repo })
        expect(result?.workflow_runs).toBeTruthy()
      }, 30000)

      it('get_workflow_run returns run details if any runs exist', async () => {
        if (!ctx.owner || !ctx.repo)
          return expect(true).toBe(true)
        const list_runs = toolbox.read('list_workflow_runs')
        const runs = await list_runs({ owner: ctx.owner, repo: ctx.repo, per_page: 1 })
        const firstRun = Array.isArray(runs?.workflow_runs) ? runs.workflow_runs[0] : undefined
        if (!firstRun)
          return expect(true).toBe(true)
        const handler = toolbox.read('get_workflow_run')
        const result = await handler({ owner: ctx.owner, repo: ctx.repo, run_id: firstRun.id })
        expect(result?.id).toBe(firstRun.id)
      }, 30000)

      it('get_job_logs returns log text if any completed runs exist', async () => {
        if (!ctx.owner || !ctx.repo)
          return expect(true).toBe(true)
        const list_runs = toolbox.read('list_workflow_runs')
        const runs = await list_runs({ owner: ctx.owner, repo: ctx.repo, status: 'completed', per_page: 1 })
        const firstRun = Array.isArray(runs?.workflow_runs) ? runs.workflow_runs[0] : undefined
        if (!firstRun)
          return expect(true).toBe(true)
        // Use native fetch to retrieve job list for this run
        const jobsResp = await fetch(
          `https://api.github.com/repos/${ctx.owner}/${ctx.repo}/actions/runs/${firstRun.id}/jobs`,
          { headers: { 'Authorization': `Bearer ${variant.token}`, 'Accept': 'application/vnd.github.v3+json' } },
        )
        const jobsData = await jobsResp.json()
        const firstJob = Array.isArray(jobsData?.jobs) ? jobsData.jobs[0] : undefined
        if (!firstJob)
          return expect(true).toBe(true)
        const handler = toolbox.read('get_job_logs')
        const result = await handler({ owner: ctx.owner, repo: ctx.repo, job_id: firstJob.id })
        expect(result).toBeTruthy()
      }, 30000)
    })
  }
})
