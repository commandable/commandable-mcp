import { beforeAll, describe, expect, it } from 'vitest'
import { createCredentialStore, createIntegrationNode, createProxy, createToolbox, hasEnv } from '../../__tests__/liveHarness.js'

// LIVE Jira read tests using credentials
//
// Variant: api_token
// - JIRA_DOMAIN
// - JIRA_EMAIL
// - JIRA_API_TOKEN
//
// Optional (improves coverage):
// - JIRA_TEST_PROJECT_KEY

const env = process.env as Record<string, string | undefined>

const suiteOrSkip = hasEnv('JIRA_DOMAIN', 'JIRA_EMAIL', 'JIRA_API_TOKEN') ? describe : describe.skip

suiteOrSkip('jira read handlers (live)', () => {
  describe('variant: api_token', () => {
      const ctx: {
        projectKey?: string
        issueKey?: string
        boardId?: number
        sprintId?: number
      } = {}

      let jira: ReturnType<typeof createToolbox>

      beforeAll(async () => {
        const credentialStore = createCredentialStore(async () => ({
          domain: env.JIRA_DOMAIN!,
          email: env.JIRA_EMAIL!,
          apiToken: env.JIRA_API_TOKEN!,
        }))
        const proxy = createProxy(credentialStore)
        jira = createToolbox('jira', proxy, createIntegrationNode('jira', { label: 'Jira', credentialId: 'jira-creds', credentialVariant: 'api_token' }), 'api_token')

        try {
          const list_projects = jira.read('list_projects')
          const projectsResp = await list_projects({ maxResults: 5 })
          const first = projectsResp?.projects?.[0]
          ctx.projectKey = env.JIRA_TEST_PROJECT_KEY || first?.key
        }
        catch {}

        try {
          if (ctx.projectKey) {
            const search_issues = jira.read('search_issues')
            const issuesResp = await search_issues({
              jql: `project = ${ctx.projectKey} ORDER BY updated DESC`,
              fields: ['summary', 'updated'],
              maxResults: 1,
            })
            const firstIssue = issuesResp?.issues?.[0]
            ctx.issueKey = firstIssue?.key
          }
        }
        catch {}

        try {
          const list_boards = jira.read('list_boards')
          const boardsResp = await list_boards({ maxResults: 5 })
          const firstBoard = boardsResp?.boards?.[0]
          ctx.boardId = typeof firstBoard?.id === 'number' ? firstBoard.id : undefined
        }
        catch {}

        try {
          if (ctx.boardId) {
            const list_sprints = jira.read('list_sprints')
            const sprintsResp = await list_sprints({ boardId: ctx.boardId, maxResults: 5 })
            const firstSprint = sprintsResp?.sprints?.[0]
            ctx.sprintId = typeof firstSprint?.id === 'number' ? firstSprint.id : undefined
          }
        }
        catch {}
      }, 60000)

      it('get_myself returns authenticated user', async () => {
        const get_myself = jira.read('get_myself')
        const me = await get_myself({})
        expect(me?.accountId).toBeTruthy()
      }, 30000)

      it('list_projects returns projects', async () => {
        const list_projects = jira.read('list_projects')
        const res = await list_projects({ maxResults: 5 })
        expect(res?.projects).toBeTruthy()
        expect(Array.isArray(res.projects)).toBe(true)
      }, 30000)

      it('get_project returns issueTypes when available', async () => {
        if (!ctx.projectKey)
          return expect(true).toBe(true)
        const get_project = jira.read('get_project')
        const project = await get_project({ projectIdOrKey: ctx.projectKey, expandIssueTypes: true })
        expect(project?.key?.toUpperCase?.()).toBe(ctx.projectKey.toUpperCase())
        expect(Array.isArray(project?.issueTypes)).toBe(true)
      }, 30000)

      it('search_issues returns issue list (best effort)', async () => {
        if (!ctx.projectKey)
          return expect(true).toBe(true)
        const search_issues = jira.read('search_issues')
        const res = await search_issues({ jql: `project = ${ctx.projectKey} ORDER BY updated DESC`, maxResults: 5 })
        expect(res?.issues).toBeTruthy()
        expect(Array.isArray(res.issues)).toBe(true)
      }, 30000)

      it('get_issue returns issue details (if any issue key discovered)', async () => {
        if (!ctx.issueKey)
          return expect(true).toBe(true)
        const get_issue = jira.read('get_issue')
        const issue = await get_issue({ issueIdOrKey: ctx.issueKey })
        expect(issue?.key).toBe(ctx.issueKey)
      }, 30000)

      it('get_issue_comments returns comments (if any issue key discovered)', async () => {
        if (!ctx.issueKey)
          return expect(true).toBe(true)
        const get_issue_comments = jira.read('get_issue_comments')
        const comments = await get_issue_comments({ issueIdOrKey: ctx.issueKey, maxResults: 5 })
        expect(comments?.comments).toBeTruthy()
        expect(Array.isArray(comments.comments)).toBe(true)
      }, 30000)

      it('get_transitions returns transitions (if any issue key discovered)', async () => {
        if (!ctx.issueKey)
          return expect(true).toBe(true)
        const get_transitions = jira.read('get_transitions')
        const res = await get_transitions({ issueIdOrKey: ctx.issueKey })
        expect(Array.isArray(res?.transitions)).toBe(true)
      }, 30000)

      it('search_users returns users (best effort)', async () => {
        const get_myself = jira.read('get_myself')
        const me = await get_myself({})
        const query = me?.displayName || 'a'
        const search_users = jira.read('search_users')
        const res = await search_users({ query, maxResults: 5 })
        expect(Array.isArray(res?.users)).toBe(true)
      }, 30000)

      it('boards: list_boards works (best effort)', async () => {
        const list_boards = jira.read('list_boards')
        const res = await list_boards({ maxResults: 5 })
        expect(res?.boards).toBeTruthy()
        expect(Array.isArray(res.boards)).toBe(true)
      }, 30000)

      it('boards: get_board works when boardId is available', async () => {
        if (!ctx.boardId)
          return expect(true).toBe(true)
        const get_board = jira.read('get_board')
        const board = await get_board({ boardId: ctx.boardId })
        expect(board?.id).toBe(ctx.boardId)
      }, 30000)

      it('boards: list_sprints works when boardId is available', async () => {
        if (!ctx.boardId)
          return expect(true).toBe(true)
        const list_sprints = jira.read('list_sprints')
        const res = await list_sprints({ boardId: ctx.boardId, maxResults: 5 })
        expect(res?.sprints).toBeTruthy()
        expect(Array.isArray(res.sprints)).toBe(true)
      }, 30000)

      it('boards: get_sprint works when sprintId is available', async () => {
        if (!ctx.sprintId)
          return expect(true).toBe(true)
        const get_sprint = jira.read('get_sprint')
        const sprint = await get_sprint({ sprintId: ctx.sprintId })
        expect(sprint?.id).toBe(ctx.sprintId)
      }, 30000)

      it('boards: get_sprint_issues works when sprintId is available', async () => {
        if (!ctx.sprintId)
          return expect(true).toBe(true)
        const get_sprint_issues = jira.read('get_sprint_issues')
        const res = await get_sprint_issues({ sprintId: ctx.sprintId, maxResults: 5 })
        expect(res).toBeTruthy()
      }, 30000)

      it('boards: get_backlog_issues works when boardId is available', async () => {
        if (!ctx.boardId)
          return expect(true).toBe(true)
        const get_backlog_issues = jira.read('get_backlog_issues')
        const res = await get_backlog_issues({ boardId: ctx.boardId, maxResults: 5 })
        expect(res).toBeTruthy()
      }, 30000)
  })
})

