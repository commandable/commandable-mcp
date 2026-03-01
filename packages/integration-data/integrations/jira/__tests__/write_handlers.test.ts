import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createCredentialStore, createIntegrationNode, createProxy, createToolbox, hasEnv, safeCleanup } from '../../__tests__/liveHarness.js'

// LIVE Jira write tests using credentials
//
// Required for write tests:
// - JIRA_TEST_PROJECT_KEY
// - JIRA_TEST_ISSUE_TYPE_NAME
//
// Variant: api_token
// - JIRA_DOMAIN
// - JIRA_EMAIL
// - JIRA_API_TOKEN
//
// Variant: oauth_token
// - JIRA_CLOUD_ID
// - JIRA_OAUTH_TOKEN
//
// Optional:
// - JIRA_TEST_TRANSITION_NAME (enables transition_issue)
// - JIRA_TEST_SPRINT_ID (enables move_issues_to_sprint)

const env = process.env as Record<string, string | undefined>

type VariantConfig =
  | { key: 'api_token', creds: { domain: string, email: string, apiToken: string } }
  | { key: 'oauth_token', creds: { cloudId: string, token: string } }

const variants: VariantConfig[] = [
  hasEnv('JIRA_DOMAIN', 'JIRA_EMAIL', 'JIRA_API_TOKEN')
    ? { key: 'api_token', creds: { domain: env.JIRA_DOMAIN!, email: env.JIRA_EMAIL!, apiToken: env.JIRA_API_TOKEN! } }
    : null,
  hasEnv('JIRA_CLOUD_ID', 'JIRA_OAUTH_TOKEN')
    ? { key: 'oauth_token', creds: { cloudId: env.JIRA_CLOUD_ID!, token: env.JIRA_OAUTH_TOKEN! } }
    : null,
].filter(Boolean) as VariantConfig[]

const hasWriteEnv = hasEnv('JIRA_TEST_PROJECT_KEY', 'JIRA_TEST_ISSUE_TYPE_NAME')
const suiteOrSkip = (variants.length > 0 && hasWriteEnv) ? describe : describe.skip

suiteOrSkip('jira write handlers (live)', () => {
  for (const variant of variants) {
    describe(`variant: ${variant.key}`, () => {
      const ctx: {
        createdIssueKey?: string
      } = {}

      let jira: ReturnType<typeof createToolbox>

      beforeAll(async () => {
        const credentialStore = createCredentialStore(async () => variant.creds)
        const proxy = createProxy(credentialStore)
        jira = createToolbox('jira', proxy, createIntegrationNode('jira', { label: 'Jira', credentialId: 'jira-creds', credentialVariant: variant.key }), variant.key)
      }, 60000)

      afterAll(async () => {
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

        const create_issue = jira.write('create_issue')
        const created = await create_issue({
          projectKey: env.JIRA_TEST_PROJECT_KEY,
          issueTypeName: env.JIRA_TEST_ISSUE_TYPE_NAME,
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

      it('move_issues_to_sprint moves issue to sprint (optional)', async () => {
        if (!env.JIRA_TEST_SPRINT_ID || !ctx.createdIssueKey)
          return expect(true).toBe(true)
        const sprintId = Number(env.JIRA_TEST_SPRINT_ID)
        if (!Number.isFinite(sprintId))
          return expect(true).toBe(true)
        const move_issues_to_sprint = jira.write('move_issues_to_sprint')
        const res = await move_issues_to_sprint({ sprintId, issueKeys: [ctx.createdIssueKey] })
        expect(res?.success === true || res).toBeTruthy()
      }, 90000)
    })
  }
})

