import { afterAll, beforeAll, describe, expect, it } from 'vitest'
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

suiteOrSkip('google-gmail read handlers (live)', () => {
  for (const variant of variants) {
    describe(`variant: ${variant.key}`, () => {
      const ctx: { email?: string, labelId?: string, messageId?: string, threadId?: string, draftId?: string } = {}
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
        ctx.labelId = labels?.labels?.[0]?.id

        const listedMessages = await gmail.read('list_messages')({ maxResults: 5 })
        ctx.messageId = listedMessages?.messages?.[0]?.id
        if (ctx.messageId) {
          const msg = await gmail.read('get_message')({ messageId: ctx.messageId, format: 'minimal' })
          ctx.threadId = msg?.threadId
        }

        if (ctx.email) {
          const draft = await gmail.write('create_draft_email')({
            to: ctx.email,
            subject: `CmdTest Gmail Draft ${Date.now()}`,
            body: 'Draft created by integration live tests.',
          })
          ctx.draftId = draft?.id
        }
      }, 60000)

      afterAll(async () => {
        await safeCleanup(async () => ctx.draftId ? gmail.write('delete_draft')({ draftId: ctx.draftId }) : Promise.resolve())
      }, 30000)

      it('get_profile returns mailbox profile', async () => {
        const result = await gmail.read('get_profile')({})
        expect(result?.emailAddress || result?.messagesTotal !== undefined).toBeTruthy()
      }, 30000)

      it('list_labels returns labels', async () => {
        const result = await gmail.read('list_labels')({})
        expect(Array.isArray(result?.labels)).toBe(true)
      }, 30000)

      it('get_label returns a label when available', async () => {
        if (!ctx.labelId)
          return expect(true).toBe(true)
        const result = await gmail.read('get_label')({ labelId: ctx.labelId })
        expect(result?.id).toBe(ctx.labelId)
      }, 30000)

      it('list_messages returns messages list', async () => {
        const result = await gmail.read('list_messages')({ maxResults: 10 })
        expect(result?.resultSizeEstimate !== undefined || Array.isArray(result?.messages)).toBe(true)
      }, 30000)

      it('get_message returns a message when available', async () => {
        if (!ctx.messageId)
          return expect(true).toBe(true)
        const result = await gmail.read('get_message')({ messageId: ctx.messageId, format: 'full' })
        expect(result?.id).toBe(ctx.messageId)
      }, 30000)

      it('list_threads returns threads list', async () => {
        const result = await gmail.read('list_threads')({ maxResults: 10 })
        expect(result?.resultSizeEstimate !== undefined || Array.isArray(result?.threads)).toBe(true)
      }, 30000)

      it('get_thread returns a thread when available', async () => {
        if (!ctx.threadId)
          return expect(true).toBe(true)
        const result = await gmail.read('get_thread')({ threadId: ctx.threadId, format: 'full' })
        expect(result?.id).toBe(ctx.threadId)
      }, 30000)

      it('list_drafts returns drafts list', async () => {
        const result = await gmail.read('list_drafts')({ maxResults: 10 })
        expect(result?.resultSizeEstimate !== undefined || Array.isArray(result?.drafts)).toBe(true)
      }, 30000)

      it('get_draft returns draft details when available', async () => {
        if (!ctx.draftId)
          return expect(true).toBe(true)
        const result = await gmail.read('get_draft')({ draftId: ctx.draftId })
        expect(result?.id).toBe(ctx.draftId)
      }, 30000)

      it('read_email returns flat decoded message when a message is available', async () => {
        if (!ctx.messageId)
          return expect(true).toBe(true)
        const result = await gmail.read('read_email')({ messageId: ctx.messageId })
        expect(result?.id).toBe(ctx.messageId)
        expect(typeof result?.subject).toBe('string')
        expect(typeof result?.from).toBe('string')
        expect(typeof result?.date).toBe('string')
        expect(typeof result?.snippet).toBe('string')
        expect(typeof result?.body).toBe('string')
        expect(Array.isArray(result?.labelIds)).toBe(true)
      }, 30000)
    })
  }
})
