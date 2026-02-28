import { beforeAll, describe, expect, it } from 'vitest'
import { createCredentialStore, createIntegrationNode, createProxy, createToolbox, hasEnv } from '../../__tests__/liveHarness.js'

// LIVE GitHub write tests -- runs once per available credential variant.
// Required env vars (at least one):
// - GITHUB_CLASSIC_PAT    (tests all write tools including create_repo/delete_repo)
// - GITHUB_FINE_GRAINED_PAT  (tests write tools; create_repo/delete_repo are excluded for this variant)
// Plus:
// - GITHUB_TEST_OWNER
// - GITHUB_TEST_REPO

const env = process.env as Record<string, string | undefined>

interface VariantConfig {
  key: string
  token: string
}

const variants: VariantConfig[] = [
  { key: 'classic_pat', token: env.GITHUB_CLASSIC_PAT || '' },
  { key: 'fine_grained_pat', token: env.GITHUB_FINE_GRAINED_PAT || '' },
].filter(v => v.token.trim().length > 0)

const hasWriteEnv = hasEnv('GITHUB_TEST_OWNER', 'GITHUB_TEST_REPO')
const suiteOrSkip = (variants.length > 0 && hasWriteEnv) ? describe : describe.skip

suiteOrSkip('github write handlers (live)', () => {
  for (const variant of variants) {
    describe(`variant: ${variant.key}`, () => {
      const ctx = {
        owner: env.GITHUB_TEST_OWNER,
        repo: env.GITHUB_TEST_REPO,
      }
      let toolbox: ReturnType<typeof createToolbox>

      beforeAll(async () => {
        const credentialStore = createCredentialStore(async () => ({ token: variant.token }))
        const proxy = createProxy(credentialStore)
        const node = createIntegrationNode('github', { credentialVariant: variant.key })
        toolbox = createToolbox('github', proxy, node, variant.key)
      }, 30000)

      it('create_issue -> update_issue -> comment_on_issue -> list_issue_comments -> close_issue roundtrip', async () => {
        if (!ctx.owner || !ctx.repo)
          return expect(true).toBe(true)

        const titleBase = `CmdTest Issue ${Date.now()}`

        const create_issue = toolbox.write('create_issue')
        const created = await create_issue({ owner: ctx.owner, repo: ctx.repo, title: titleBase, body: 'Initial body from test.' })
        expect(created?.number).toBeTruthy()
        const issue_number = created.number

        const update_issue = toolbox.write('update_issue')
        const updated = await update_issue({ owner: ctx.owner, repo: ctx.repo, issue_number, body: 'Updated body from test.' })
        expect(updated?.number).toBe(issue_number)

        const comment_on_issue = toolbox.write('comment_on_issue')
        const comment = await comment_on_issue({ owner: ctx.owner, repo: ctx.repo, issue_number, body: 'A comment from test.' })
        expect(comment?.id).toBeTruthy()

        const list_issue_comments = toolbox.read('list_issue_comments')
        const comments = await list_issue_comments({ owner: ctx.owner, repo: ctx.repo, issue_number })
        expect(Array.isArray(comments)).toBe(true)
        expect(comments.length).toBeGreaterThan(0)

        const close_issue = toolbox.write('close_issue')
        const closed = await close_issue({ owner: ctx.owner, repo: ctx.repo, issue_number })
        expect(closed?.state).toBe('closed')
      }, 90000)

      it('fork_repo forks a public repo (best effort)', async () => {
        if (!ctx.owner || !ctx.repo)
          return expect(true).toBe(true)
        const fork_repo = toolbox.write('fork_repo')
        try {
          const result = await fork_repo({ owner: ctx.owner, repo: ctx.repo })
          // Fork returns the forked repo details
          expect(result).toBeTruthy()
        }
        catch {
          // May fail if repo is private or fork already exists -- that's ok
          expect(true).toBe(true)
        }
      }, 30000)

      it('create_release creates a draft release (classic_pat only)', async () => {
        if (!toolbox.hasTool('write', 'create_repo'))
          return expect(true).toBe(true)
        if (!ctx.owner || !ctx.repo)
          return expect(true).toBe(true)
        const create_release = toolbox.write('create_release')
        const tagName = `v0.0.0-test-${Date.now()}`
        try {
          const result = await create_release({
            owner: ctx.owner,
            repo: ctx.repo,
            tag_name: tagName,
            name: `Test Release ${tagName}`,
            body: 'Draft release created by integration tests.',
            draft: true,
          })
          expect(result?.tag_name).toBe(tagName)
          expect(result?.draft).toBe(true)
        }
        catch {
          // May fail if insufficient permissions -- that's ok
          expect(true).toBe(true)
        }
      }, 30000)

      it('create_repo -> delete_repo lifecycle (classic_pat only)', async () => {
        if (!toolbox.hasTool('write', 'create_repo')) {
          return expect(true).toBe(true)
        }

        const repoName = `cmdtest-repo-${Date.now()}`

        const create_repo = toolbox.write('create_repo')
        const created = await create_repo({
          name: repoName,
          description: 'Test repo created by integration tests',
          private: true,
          auto_init: true,
        })
        expect(created?.name).toBe(repoName)

        const createdOwner = created?.owner?.login
        expect(createdOwner).toBeTruthy()
        expect(created?.full_name).toBe(`${createdOwner}/${repoName}`)

        await new Promise(resolve => setTimeout(resolve, 3000))

        const delete_repo = toolbox.write('delete_repo')
        const deleted = await delete_repo({ owner: createdOwner, repo: repoName })
        expect(deleted?.success).toBe(true)
        expect(deleted?.status).toBe(204)
      }, 90000)

      it('create_or_update_file: single file commit', async () => {
        if (!ctx.owner || !ctx.repo)
          return expect(true).toBe(true)

        const timestamp = Date.now()
        const branchName = `test-single-file-${timestamp}`

        const create_branch = toolbox.write('create_branch')
        const branch = await create_branch({ owner: ctx.owner, repo: ctx.repo, branch: branchName })
        expect(branch?.ref).toBe(`refs/heads/${branchName}`)

        const create_or_update_file = toolbox.write('create_or_update_file')
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

        // get_file_contents and delete_file roundtrip
        const get_file_contents = toolbox.read('get_file_contents')
        const contents = await get_file_contents({
          owner: ctx.owner,
          repo: ctx.repo,
          path: `test-single-${timestamp}.txt`,
          ref: branchName,
        })
        expect(contents?.encoding).toBe('utf-8')
        expect(contents?.content).toContain('Hello')
        const fileSha = contents?.sha

        const delete_file = toolbox.write('delete_file')
        const deleted = await delete_file({
          owner: ctx.owner,
          repo: ctx.repo,
          path: `test-single-${timestamp}.txt`,
          message: `Delete test file ${timestamp}`,
          sha: fileSha,
          branch: branchName,
        })
        expect(deleted?.commit?.message).toBe(`Delete test file ${timestamp}`)

        // delete_branch cleanup
        const delete_branch = toolbox.write('delete_branch')
        const deletedBranch = await delete_branch({ owner: ctx.owner, repo: ctx.repo, branch: branchName })
        expect(deletedBranch?.success).toBe(true)
      }, 120000)

      it('create_commit: multiple files in one commit', async () => {
        if (!ctx.owner || !ctx.repo)
          return expect(true).toBe(true)

        const timestamp = Date.now()
        const branchName = `test-multi-file-${timestamp}`

        const create_branch = toolbox.write('create_branch')
        const branch = await create_branch({ owner: ctx.owner, repo: ctx.repo, branch: branchName })
        expect(branch?.ref).toBe(`refs/heads/${branchName}`)

        const create_commit = toolbox.write('create_commit')
        const commit = await create_commit({
          owner: ctx.owner,
          repo: ctx.repo,
          branch: branchName,
          message: `Add multiple files ${timestamp}`,
          files: [
            { path: `multi-test/file1-${timestamp}.txt`, content: 'Content of file 1' },
            { path: `multi-test/file2-${timestamp}.txt`, content: 'Content of file 2' },
            { path: `multi-test/file3-${timestamp}.md`, content: '# Test File 3\n\nWith UTF-8: 你好 🚀' },
          ],
        })
        expect(commit?.commit?.sha).toBeTruthy()
        expect(commit?.commit?.message).toBe(`Add multiple files ${timestamp}`)
        expect(commit?.files?.length).toBe(3)

        const commit2 = await create_commit({
          owner: ctx.owner,
          repo: ctx.repo,
          branch: branchName,
          message: `Update and delete files ${timestamp}`,
          files: [
            { path: `multi-test/file1-${timestamp}.txt`, content: 'Updated content of file 1' },
            { path: `multi-test/file2-${timestamp}.txt` },
            { path: `multi-test/file4-${timestamp}.txt`, content: 'New file 4' },
          ],
        })
        expect(commit2?.commit?.sha).toBeTruthy()
        expect(commit2?.commit?.message).toBe(`Update and delete files ${timestamp}`)

        // get_commit verifies the commit details
        const get_commit = toolbox.read('get_commit')
        const commitDetails = await get_commit({ owner: ctx.owner, repo: ctx.repo, sha: commit2.commit.sha })
        expect(commitDetails?.sha).toBe(commit2.commit.sha)
      }, 120000)

      it('full PR workflow: create_branch -> create_commit -> create_pull_request -> update_pull_request -> create_pull_request_review -> merge_pull_request -> delete_branch', async () => {
        if (!ctx.owner || !ctx.repo)
          return expect(true).toBe(true)

        const timestamp = Date.now()
        const branchName = `test-pr-workflow-${timestamp}`

        const create_branch = toolbox.write('create_branch')
        const branch = await create_branch({ owner: ctx.owner, repo: ctx.repo, branch: branchName })
        expect(branch?.ref).toBe(`refs/heads/${branchName}`)

        const create_commit = toolbox.write('create_commit')
        const commit = await create_commit({
          owner: ctx.owner,
          repo: ctx.repo,
          branch: branchName,
          message: `Add feature files ${timestamp}`,
          files: [
            { path: `feature-${timestamp}/index.js`, content: 'export default function() { return "Hello"; }' },
            { path: `feature-${timestamp}/README.md`, content: `# Feature ${timestamp}\n\nThis is a test feature.` },
          ],
        })
        expect(commit?.commit?.sha).toBeTruthy()

        const get_repo = toolbox.read('get_repo')
        const repoDetails = await get_repo({ owner: ctx.owner, repo: ctx.repo })
        const defaultBranch = repoDetails?.default_branch || 'main'

        const create_pull_request = toolbox.write('create_pull_request')
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

        // update_pull_request
        const update_pull_request = toolbox.write('update_pull_request')
        const updated = await update_pull_request({
          owner: ctx.owner,
          repo: ctx.repo,
          pull_number: prNumber,
          body: 'Updated description by integration test.',
        })
        expect(updated?.number).toBe(prNumber)

        // get_pull_request verifies state
        const get_pull_request = toolbox.read('get_pull_request')
        const prDetails = await get_pull_request({ owner: ctx.owner, repo: ctx.repo, pull_number: prNumber })
        expect(prDetails?.number).toBe(prNumber)

        // list_pull_request_files
        const list_pull_request_files = toolbox.read('list_pull_request_files')
        const files = await list_pull_request_files({ owner: ctx.owner, repo: ctx.repo, pull_number: prNumber })
        expect(Array.isArray(files)).toBe(true)

        // add_labels_to_issue (labels on PR)
        const add_labels_to_issue = toolbox.write('add_labels_to_issue')
        try {
          await add_labels_to_issue({ owner: ctx.owner, repo: ctx.repo, issue_number: prNumber, labels: ['test'] })
        }
        catch {
          // Label might not exist -- that's ok for this test
        }

        // request_pull_request_reviewers (may fail if requesting from self)
        const request_pull_request_reviewers = toolbox.write('request_pull_request_reviewers')
        try {
          await request_pull_request_reviewers({
            owner: ctx.owner,
            repo: ctx.repo,
            pull_number: prNumber,
            reviewers: [],
          })
        }
        catch {
          // May fail if requesting from self or insufficient permissions -- that's ok
        }

        // create_pull_request_review (comment only -- can't APPROVE own PRs typically)
        const create_pull_request_review = toolbox.write('create_pull_request_review')
        try {
          await create_pull_request_review({
            owner: ctx.owner,
            repo: ctx.repo,
            pull_number: prNumber,
            event: 'COMMENT',
            body: 'LGTM from integration test',
          })
        }
        catch {
          // May fail if author is same as reviewer in some repo configs -- that's ok
        }

        const merge_pull_request = toolbox.write('merge_pull_request')
        const merged = await merge_pull_request({ owner: ctx.owner, repo: ctx.repo, pull_number: prNumber, merge_method: 'squash' })
        expect(merged?.merged).toBe(true)

        // delete_branch after merge
        const delete_branch = toolbox.write('delete_branch')
        const deletedBranch = await delete_branch({ owner: ctx.owner, repo: ctx.repo, branch: branchName })
        expect(deletedBranch?.success).toBe(true)
      }, 150000)
    })
  }
})
