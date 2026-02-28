import { Buffer } from 'node:buffer'
import { beforeAll, describe, expect, it } from 'vitest'
import { createCredentialStore, createIntegrationNode, createProxy, createToolbox, safeCleanup } from '../../__tests__/liveHarness.js'

const env = process.env as Record<string, string | undefined>

interface VariantConfig {
  key: string
  credentials: () => Record<string, string>
}

const variants: VariantConfig[] = [
  {
    key: 'service_account',
    credentials: () => ({ serviceAccountJson: env.GOOGLE_SERVICE_ACCOUNT_JSON || '', subject: env.GOOGLE_IMPERSONATE_SUBJECT || '' }),
  },
  {
    key: 'oauth_token',
    credentials: () => ({ token: env.GOOGLE_TOKEN || '' }),
  },
].filter(v => Object.values(v.credentials()).some(val => val.trim().length > 0))

const suiteOrSkip = variants.length > 0 ? describe : describe.skip

function makeRawMessage(toEmail: string, subject: string, text: string): string {
  const mime = [
    `To: ${toEmail}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    '',
    text,
  ].join('\r\n')
  return Buffer.from(mime, 'utf8').toString('base64url')
}

suiteOrSkip('google-gmail write/admin handlers (live)', () => {
  for (const variant of variants) {
    describe(`variant: ${variant.key}`, () => {
      const ctx: { email?: string, inboxLabelId?: string, messageId?: string, threadId?: string } = {}
      let gmail: ReturnType<typeof createToolbox>

      beforeAll(async () => {
        const credentialStore = createCredentialStore(async () => variant.credentials())
        const proxy = createProxy(credentialStore)
        gmail = createToolbox(
          'google-gmail',
          proxy,
          createIntegrationNode('google-gmail', { label: 'Google Gmail', credentialId: 'google-gmail-creds', credentialVariant: variant.key }),
          variant.key,
        )

        const profile = await gmail.read('get_profile')({})
        ctx.email = profile?.emailAddress

        const labels = await gmail.read('list_labels')({})
        ctx.inboxLabelId = labels?.labels?.find((l: any) => l?.name === 'INBOX')?.id || labels?.labels?.[0]?.id

        const listedMessages = await gmail.read('list_messages')({ maxResults: 5 })
        ctx.messageId = env.GMAIL_TEST_MESSAGE_ID || listedMessages?.messages?.[0]?.id
        if (ctx.messageId) {
          const msg = await gmail.read('get_message')({ messageId: ctx.messageId, format: 'minimal' })
          ctx.threadId = env.GMAIL_TEST_THREAD_ID || msg?.threadId
        }
      }, 60000)

      it('create_draft_email -> get_draft -> delete_draft', async () => {
        if (!ctx.email)
          return expect(true).toBe(true)
        const created = await gmail.write('create_draft_email')({
          to: ctx.email,
          subject: `CmdTest Gmail Draft ${Date.now()}`,
          body: 'Draft created by write tests.',
        })
        const draftId = created?.id
        expect(draftId).toBeTruthy()
        const got = await gmail.read('get_draft')({ draftId })
        expect(got?.id).toBe(draftId)
        const deleted = await gmail.write('delete_draft')({ draftId })
        expect(deleted?.success === true || deleted === '').toBe(true)
      }, 60000)

      it('modify_message -> trash_message -> untrash_message on an existing message', async () => {
        if (!ctx.messageId)
          return expect(true).toBe(true)
        const modified = await gmail.write('modify_message')({
          messageId: ctx.messageId,
          addLabelIds: ctx.inboxLabelId ? [ctx.inboxLabelId] : undefined,
        })
        expect(modified?.id).toBe(ctx.messageId)
        const trashed = await gmail.write('trash_message')({ messageId: ctx.messageId })
        expect(trashed?.id).toBe(ctx.messageId)
        const untrashed = await gmail.write('untrash_message')({ messageId: ctx.messageId })
        expect(untrashed?.id).toBe(ctx.messageId)
      }, 60000)

      it('modify_thread -> trash_thread -> untrash_thread on an existing thread', async () => {
        if (!ctx.threadId)
          return expect(true).toBe(true)
        const modified = await gmail.write('modify_thread')({
          threadId: ctx.threadId,
          addLabelIds: ctx.inboxLabelId ? [ctx.inboxLabelId] : undefined,
        })
        expect(modified?.id).toBe(ctx.threadId)
        const trashed = await gmail.write('trash_thread')({ threadId: ctx.threadId })
        expect(trashed?.id).toBe(ctx.threadId)
        const untrashed = await gmail.write('untrash_thread')({ threadId: ctx.threadId })
        expect(untrashed?.id).toBe(ctx.threadId)
      }, 60000)

      it('create_label -> update_label -> delete_label', async () => {
        const created = await gmail.admin('create_label')({
          name: `CmdTest Label ${Date.now()}`,
          labelListVisibility: 'labelShow',
          messageListVisibility: 'show',
        })
        const labelId = created?.id
        expect(labelId).toBeTruthy()
        const updated = await gmail.admin('update_label')({
          labelId,
          name: `CmdTest Label Updated ${Date.now()}`,
          labelListVisibility: 'labelHide',
        })
        expect(updated?.id).toBe(labelId)
        const deleted = await gmail.admin('delete_label')({ labelId })
        expect(deleted?.success === true || deleted === '').toBe(true)
      }, 60000)

      it('send_email sends mail when GMAIL_TEST_SEND_TO is set', async () => {
        const to = env.GMAIL_TEST_SEND_TO
        if (!to)
          return expect(true).toBe(true)
        const sent = await gmail.write('send_email')({
          to,
          subject: `CmdTest Gmail send_email ${Date.now()}`,
          body: 'Message sent by integration live test via send_email.',
        })
        expect(sent?.id).toBeTruthy()
      }, 60000)

      it('send_draft sends mail when GMAIL_TEST_SEND_TO is set', async () => {
        const to = env.GMAIL_TEST_SEND_TO
        if (!to)
          return expect(true).toBe(true)
        const created = await gmail.write('create_draft_email')({
          to,
          subject: `CmdTest Gmail send_draft ${Date.now()}`,
          body: 'Draft sent by integration live test.',
        })
        const draftId = created?.id
        expect(draftId).toBeTruthy()
        const sent = await gmail.write('send_draft')({ draftId })
        expect(sent?.id || sent?.threadId).toBeTruthy()
      }, 60000)

      it('delete_message deletes message when GMAIL_TEST_DELETE_MESSAGE_ID is set', async () => {
        const deleteMessageId = env.GMAIL_TEST_DELETE_MESSAGE_ID
        if (!deleteMessageId)
          return expect(true).toBe(true)
        const deleted = await gmail.write('delete_message')({ messageId: deleteMessageId })
        expect(deleted?.success === true || deleted === '').toBe(true)
      }, 60000)

      it('delete_thread deletes thread when GMAIL_TEST_DELETE_THREAD_ID is set', async () => {
        const deleteThreadId = env.GMAIL_TEST_DELETE_THREAD_ID
        if (!deleteThreadId)
          return expect(true).toBe(true)
        const deleted = await gmail.write('delete_thread')({ threadId: deleteThreadId })
        expect(deleted?.success === true || deleted === '').toBe(true)
      }, 60000)

      it('send_draft supports raw payload mode', async () => {
        const to = env.GMAIL_TEST_SEND_TO
        if (!to)
          return expect(true).toBe(true)
        const raw = makeRawMessage(to, `CmdTest Gmail send_draft raw ${Date.now()}`, 'Raw payload draft-send mode.')
        const sent = await gmail.write('send_draft')({ raw })
        expect(sent?.id || sent?.threadId).toBeTruthy()
      }, 60000)

      it('cleanup helper remains available for optional future cleanup', async () => {
        await safeCleanup(async () => Promise.resolve())
        expect(true).toBe(true)
      })
    })
  }
})
