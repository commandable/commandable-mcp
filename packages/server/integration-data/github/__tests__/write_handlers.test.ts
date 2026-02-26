import { beforeAll, describe, expect, it } from 'vitest'
import { IntegrationProxy } from '../../../src/integrations/proxy.js'
import { loadIntegrationTools } from '../../../src/integrations/dataLoader.js'

// LIVE GitHub write tests using managed OAuth
// Required env vars for write tests:
// - COMMANDABLE_MANAGED_OAUTH_BASE_URL
// - COMMANDABLE_MANAGED_OAUTH_SECRET_KEY
// - GITHUB_TEST_CONNECTION_ID (managed OAuth connection for provider 'github')
// - GITHUB_TEST_OWNER (owner to use for write tests)
// - GITHUB_TEST_REPO (repo to use for write tests)

interface Ctx {
  owner?: string
  repo?: string
  issue_number?: number
}

const env = process.env as Record<string, string>
const hasEnv = (...keys: string[]) => keys.every(k => !!env[k] && env[k].trim().length > 0)
const suite = hasEnv(
  'COMMANDABLE_MANAGED_OAUTH_BASE_URL',
  'COMMANDABLE_MANAGED_OAUTH_SECRET_KEY',
  'GITHUB_TEST_CONNECTION_ID',
  'GITHUB_TEST_OWNER',
  'GITHUB_TEST_REPO',
)
  ? describe
  : describe.skip

suite('github write handlers (live)', () => {
  const ctx: Ctx = {}
  let buildWriteHandler: (name: string) => ((input: any) => Promise<any>)
  let buildReadHandler: (name: string) => ((input: any) => Promise<any>)

  beforeAll(async () => {
    const {
      COMMANDABLE_MANAGED_OAUTH_BASE_URL,
      COMMANDABLE_MANAGED_OAUTH_SECRET_KEY,
      GITHUB_TEST_CONNECTION_ID,
      GITHUB_TEST_OWNER,
      GITHUB_TEST_REPO,
    } = env

    const proxy = new IntegrationProxy({
      managedOAuthBaseUrl: COMMANDABLE_MANAGED_OAUTH_BASE_URL,
      managedOAuthSecretKey: COMMANDABLE_MANAGED_OAUTH_SECRET_KEY,
    })
    const integrationNode = { id: 'node-github', type: 'github', label: 'GitHub', connectionId: GITHUB_TEST_CONNECTION_ID } as any

    const tools = loadIntegrationTools('github')
    expect(tools).toBeTruthy()

    buildWriteHandler = (name: string) => {
      const tool = tools!.write.find(t => t.name === name)
      expect(tool, `write tool ${name} exists`).toBeTruthy()
      const integration = { fetch: (path: string, init?: RequestInit) => proxy.call(integrationNode, path, init) }
      const build = new Function('integration', `return (${tool!.handlerCode});`)
      return build(integration) as (input: any) => Promise<any>
    }

    buildReadHandler = (name: string) => {
      const tool = tools!.read.find(t => t.name === name)
      expect(tool, `read tool ${name} exists`).toBeTruthy()
      const integration = { fetch: (path: string, init?: RequestInit) => proxy.call(integrationNode, path, init) }
      const build = new Function('integration', `return (${tool!.handlerCode});`)
      return build(integration) as (input: any) => Promise<any>
    }

    ctx.owner = GITHUB_TEST_OWNER
    ctx.repo = GITHUB_TEST_REPO
  }, 60000)

  it('create_issue -> update_issue -> comment_on_issue -> close_issue roundtrip', async () => {
    if (!ctx.owner || !ctx.repo)
      return expect(true).toBe(true)

    const titleBase = `CmdTest Issue ${Date.now()}`

    // Create
    const create_issue = buildWriteHandler('create_issue')
    const created = await create_issue({ owner: ctx.owner, repo: ctx.repo, title: titleBase, body: 'Initial body from test.' })
    expect(created?.number).toBeTruthy()
    ctx.issue_number = created.number

    // Update
    const update_issue = buildWriteHandler('update_issue')
    const updated = await update_issue({ owner: ctx.owner, repo: ctx.repo, issue_number: ctx.issue_number, body: 'Updated body from test.' })
    expect(updated?.number).toBe(ctx.issue_number)

    // Comment
    const comment_on_issue = buildWriteHandler('comment_on_issue')
    const comment = await comment_on_issue({ owner: ctx.owner, repo: ctx.repo, issue_number: ctx.issue_number, body: 'A comment from test.' })
    expect(comment?.id).toBeTruthy()

    // Close
    const close_issue = buildWriteHandler('close_issue')
    const closed = await close_issue({ owner: ctx.owner, repo: ctx.repo, issue_number: ctx.issue_number })
    expect(closed?.state).toBe('closed')
  }, 90000)

  it('create_repo -> delete_repo lifecycle', async () => {
    if (!ctx.owner)
      return expect(true).toBe(true)

    const repoName = `cmdtest-repo-${Date.now()}`

    // Create
    const create_repo = buildWriteHandler('create_repo')
    const created = await create_repo({
      name: repoName,
      description: 'Test repo created by integration tests',
      private: true,
      auto_init: true,
    })
    expect(created?.name).toBe(repoName)
    expect(created?.full_name).toBe(`${ctx.owner}/${repoName}`)

    // Delete
    const delete_repo = buildWriteHandler('delete_repo')
    const deleted = await delete_repo({ owner: ctx.owner, repo: repoName })
    expect(deleted?.success).toBe(true)
    expect(deleted?.status).toBe(204)
  }, 90000)

  it('create_or_update_file: single file commit', async () => {
    if (!ctx.owner || !ctx.repo)
      return expect(true).toBe(true)

    const timestamp = Date.now()
    const branchName = `test-single-file-${timestamp}`

    // Create a new branch
    const create_branch = buildWriteHandler('create_branch')
    const branch = await create_branch({
      owner: ctx.owner,
      repo: ctx.repo,
      branch: branchName,
    })
    expect(branch?.ref).toBe(`refs/heads/${branchName}`)

    // Create a file using create_or_update_file
    const create_or_update_file = buildWriteHandler('create_or_update_file')
    const file = await create_or_update_file({
      owner: ctx.owner,
      repo: ctx.repo,
      path: `test-single-${timestamp}.txt`,
      message: `Add single test file ${timestamp}`,
      content: `Test content with UTF-8: Hello 世界 🌍\nCreated at ${timestamp}`,
      branch: branchName,
    })
    expect(file?.commit?.message).toBe(`Add single test file ${timestamp}`)
    expect(file?.content?.path).toBe(`test-single-${timestamp}.txt`)
    
    // Update the same file
    const updated = await create_or_update_file({
      owner: ctx.owner,
      repo: ctx.repo,
      path: `test-single-${timestamp}.txt`,
      message: `Update test file ${timestamp}`,
      content: `Updated content at ${timestamp}`,
      branch: branchName,
      sha: file.content.sha,
    })
    expect(updated?.commit?.message).toBe(`Update test file ${timestamp}`)
  }, 90000)

  it('create_commit: multiple files in one commit', async () => {
    if (!ctx.owner || !ctx.repo)
      return expect(true).toBe(true)

    const timestamp = Date.now()
    const branchName = `test-multi-file-${timestamp}`

    // Create a new branch
    const create_branch = buildWriteHandler('create_branch')
    const branch = await create_branch({
      owner: ctx.owner,
      repo: ctx.repo,
      branch: branchName,
    })
    expect(branch?.ref).toBe(`refs/heads/${branchName}`)

    // Create multiple files in one commit using create_commit
    const create_commit = buildWriteHandler('create_commit')
    const commit = await create_commit({
      owner: ctx.owner,
      repo: ctx.repo,
      branch: branchName,
      message: `Add multiple files ${timestamp}`,
      files: [
        {
          path: `multi-test/file1-${timestamp}.txt`,
          content: 'Content of file 1',
        },
        {
          path: `multi-test/file2-${timestamp}.txt`,
          content: 'Content of file 2',
        },
        {
          path: `multi-test/file3-${timestamp}.md`,
          content: '# Test File 3\n\nWith UTF-8: 你好 🚀',
        },
      ],
    })
    expect(commit?.commit?.sha).toBeTruthy()
    expect(commit?.commit?.message).toBe(`Add multiple files ${timestamp}`)
    expect(commit?.files?.length).toBe(3)

    // Update and delete files in another commit
    const commit2 = await create_commit({
      owner: ctx.owner,
      repo: ctx.repo,
      branch: branchName,
      message: `Update and delete files ${timestamp}`,
      files: [
        {
          path: `multi-test/file1-${timestamp}.txt`,
          content: 'Updated content of file 1',
        },
        {
          path: `multi-test/file2-${timestamp}.txt`,
          // Omit content to delete the file
        },
        {
          path: `multi-test/file4-${timestamp}.txt`,
          content: 'New file 4',
        },
      ],
    })
    expect(commit2?.commit?.sha).toBeTruthy()
    expect(commit2?.commit?.message).toBe(`Update and delete files ${timestamp}`)
  }, 120000)

  it('full PR workflow: create_branch -> create_commit -> create_pull_request -> merge_pull_request', async () => {
    if (!ctx.owner || !ctx.repo)
      return expect(true).toBe(true)

    const timestamp = Date.now()
    const branchName = `test-pr-workflow-${timestamp}`

    // Create a new branch
    const create_branch = buildWriteHandler('create_branch')
    const branch = await create_branch({
      owner: ctx.owner,
      repo: ctx.repo,
      branch: branchName,
    })
    expect(branch?.ref).toBe(`refs/heads/${branchName}`)

    // Create multiple files using create_commit
    const create_commit = buildWriteHandler('create_commit')
    const commit = await create_commit({
      owner: ctx.owner,
      repo: ctx.repo,
      branch: branchName,
      message: `Add feature files ${timestamp}`,
      files: [
        {
          path: `feature-${timestamp}/index.js`,
          content: 'export default function() { return "Hello"; }',
        },
        {
          path: `feature-${timestamp}/README.md`,
          content: `# Feature ${timestamp}\n\nThis is a test feature.`,
        },
      ],
    })
    expect(commit?.commit?.sha).toBeTruthy()

    // Create a pull request
    const create_pull_request = buildWriteHandler('create_pull_request')
    const get_repo = buildReadHandler('get_repo')
    const repoDetails = await get_repo({ owner: ctx.owner, repo: ctx.repo })
    const defaultBranch = repoDetails?.default_branch || 'main'
    const pr = await create_pull_request({
      owner: ctx.owner,
      repo: ctx.repo,
      title: `Test PR workflow ${timestamp}`,
      body: 'This PR was created by integration tests to test the full workflow',
      head: branchName,
      base: defaultBranch,
    })
    expect(pr?.number).toBeTruthy()
    const prNumber = pr.number

    // Add labels to the PR
    const add_labels_to_issue = buildWriteHandler('add_labels_to_issue')
    try {
      await add_labels_to_issue({
        owner: ctx.owner,
        repo: ctx.repo,
        issue_number: prNumber,
        labels: ['test'],
      })
    } catch (e) {
      // Label might not exist, that's ok for this test
      console.log('Label add skipped (label may not exist)')
    }

    // Merge the pull request
    const merge_pull_request = buildWriteHandler('merge_pull_request')
    const merged = await merge_pull_request({
      owner: ctx.owner,
      repo: ctx.repo,
      pull_number: prNumber,
      merge_method: 'squash',
    })
    expect(merged?.merged).toBe(true)
  }, 150000)
})
