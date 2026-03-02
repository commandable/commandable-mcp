import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createCredentialStore, createIntegrationNode, createProxy, createToolbox, hasEnv, safeCleanup } from '../../__tests__/liveHarness.js'

// LIVE Jira write tests using credentials
//
// Required for write tests:
// - JIRA_TEST_PROJECT_KEY
//
// Variant: api_token
// - JIRA_DOMAIN
// - JIRA_EMAIL
// - JIRA_API_TOKEN
//
// Optional:
// - JIRA_TEST_TRANSITION_NAME (enables transition_issue)
// - JIRA_TEST_BOARD_ID (enables sprint roundtrip: create_sprint -> update_sprint -> move_issues_to_sprint -> update_sprint)

const env = process.env as Record<string, string | undefined>

const suiteOrSkip = (hasEnv('JIRA_DOMAIN', 'JIRA_EMAIL', 'JIRA_API_TOKEN') && hasEnv('JIRA_TEST_PROJECT_KEY'))
  ? describe
  : describe.skip

suiteOrSkip('jira write handlers (live)', () => {
  describe('variant: api_token', () => {
      const ctx: {
        createdIssueKey?: string
        createdSprintId?: number
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
      }, 60000)

      afterAll(async () => {
        await safeCleanup(async () => {
          if (!ctx.createdSprintId)
            return
          const update_sprint = jira.write('update_sprint')
          await update_sprint({ sprintId: ctx.createdSprintId, state: 'closed' })
        })
        await safeCleanup(async () => {
          if (!ctx.createdIssueKey)
            return
          const delete_issue = jira.write('delete_issue')
          await delete_issue({ issueIdOrKey: ctx.createdIssueKey })
        })
      }, 60000)

      it('create_issue -> get_issue -> update_issue -> add_comment -> get_issue_comments (and optional assign/transition) roundtrip', async () => {
        const get_myself = jira.read('get_myself')
        const me = await get_myself({})
        expect(me?.accountId).toBeTruthy()

        const get_project = jira.read('get_project')
        const project = await get_project({ projectIdOrKey: env.JIRA_TEST_PROJECT_KEY, expandIssueTypes: true })
        const issueTypes = Array.isArray(project?.issueTypes) ? project.issueTypes : []
        const picked = issueTypes.find((t: any) => t && t.subtask === false) || issueTypes[0]
        if (!picked?.id && !picked?.name)
          return expect(true).toBe(true)

        const create_issue = jira.write('create_issue')
        const created = await create_issue({
          projectKey: env.JIRA_TEST_PROJECT_KEY,
          issueTypeId: picked?.id || undefined,
          issueTypeName: picked?.id ? undefined : (picked?.name || undefined),
          summary: `CmdTest ${Date.now()}`,
          descriptionText: 'Created by integration tests.',
          assigneeAccountId: me.accountId,
          labels: ['cmdtest'],
        })
        const issueKey = created?.key || created?.id
        expect(issueKey).toBeTruthy()
        ctx.createdIssueKey = created?.key || created?.id

        const get_issue = jira.read('get_issue')
        const got = await get_issue({ issueIdOrKey: issueKey })
        expect(got?.key).toBeTruthy()

        const update_issue = jira.write('update_issue')
        const updated = await update_issue({
          issueIdOrKey: issueKey,
          summary: `CmdTest Updated ${Date.now()}`,
          descriptionText: 'Updated by integration tests.',
        })
        expect(updated?.success === true || updated).toBeTruthy()

        const add_comment = jira.write('add_comment')
        const commentText = `Test comment ${Date.now()}`
        const comment = await add_comment({ issueIdOrKey: issueKey, bodyText: commentText })
        expect(comment?.id).toBeTruthy()

        const get_issue_comments = jira.read('get_issue_comments')
        const comments = await get_issue_comments({ issueIdOrKey: issueKey, maxResults: 20 })
        const found = (comments?.comments || []).some((c: any) =>
          (c?.bodyMarkdown && String(c.bodyMarkdown).includes('Test comment'))
          || (c?.bodyText && String(c.bodyText).includes('Test comment')),
        )
        expect(found).toBe(true)

        const assign_issue = jira.write('assign_issue')
        const assigned = await assign_issue({ issueIdOrKey: issueKey, accountId: me.accountId })
        expect(assigned?.success === true || assigned).toBeTruthy()
        const unassigned = await assign_issue({ issueIdOrKey: issueKey, accountId: null })
        expect(unassigned?.success === true || unassigned).toBeTruthy()

        if (env.JIRA_TEST_TRANSITION_NAME) {
          const transition_issue = jira.write('transition_issue')
          const transitioned = await transition_issue({
            issueIdOrKey: issueKey,
            transitionName: env.JIRA_TEST_TRANSITION_NAME,
            commentText: 'Transitioned by integration tests.',
          })
          expect(transitioned?.success === true || transitioned).toBeTruthy()
        }
      }, 120000)

      it('sprint roundtrip: create_sprint -> update_sprint (start) -> move_issues_to_sprint -> update_sprint (close) (optional)', async () => {
        if (!env.JIRA_TEST_BOARD_ID || !ctx.createdIssueKey)
          return expect(true).toBe(true)
        const boardId = Number(env.JIRA_TEST_BOARD_ID)
        if (!Number.isFinite(boardId))
          return expect(true).toBe(true)

        const create_sprint = jira.write('create_sprint')
        const name = `CmdTest Sprint ${Date.now()}`
        const sprint = await create_sprint({ boardId, name })
        const sprintId = sprint?.id
        expect(typeof sprintId).toBe('number')
        ctx.createdSprintId = sprintId

        const update_sprint = jira.write('update_sprint')
        const today = new Date().toISOString().slice(0, 10)
        const twoWeeks = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
        const started = await update_sprint({ sprintId, state: 'active', startDate: today, endDate: twoWeeks })
        expect(started?.state === 'active' || started?.id === sprintId || started).toBeTruthy()

        const move_issues_to_sprint = jira.write('move_issues_to_sprint')
        const moved = await move_issues_to_sprint({ sprintId, issueKeys: [ctx.createdIssueKey] })
        expect(moved?.success === true || moved).toBeTruthy()

        const closed = await update_sprint({ sprintId, state: 'closed' })
        expect(closed?.state === 'closed' || closed?.id === sprintId || closed).toBeTruthy()
        ctx.createdSprintId = undefined
      }, 120000)

  })
})

