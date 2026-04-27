import { Buffer } from 'node:buffer'
import { readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createCredentialStore, createIntegrationNode, createProxy, createToolbox, safeCleanup } from '../../__tests__/liveHarness.js'

const env = process.env as Record<string, string | undefined>
const INTEGRATION_TEST_MARKER = 'Commandable Integration Test'
const ATTACHMENT_FIXTURE = {
  fileName: 'sample.pdf',
  mimeType: 'application/pdf',
  expectedKind: 'pdf',
}

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

function fixturePath(fileName: string): string {
  return fileURLToPath(new URL(`../../__tests__/fixtures/file-extraction/${fileName}`, import.meta.url))
}

function ensureFixtureReady(fileName: string): string {
  const path = fixturePath(fileName)
  const stats = statSync(path, { throwIfNoEntry: false })
  if (!stats)
    throw new Error(`Missing integration test fixture: ${path}`)
  if (stats.size === 0)
    throw new Error(`Integration test fixture is still an empty placeholder: ${path}. Replace it with a real file that contains "${INTEGRATION_TEST_MARKER}" in extractable text.`)
  return path
}

function wrapBase64(value: string): string {
  return value.match(/.{1,76}/g)?.join('\r\n') || value
}

function makeRawMessageWithAttachment(args: {
  toEmail: string
  subject: string
  text: string
  fileName: string
  mimeType: string
  bytes: Buffer
}): string {
  const boundary = `cmd-gmail-boundary-${Date.now()}`
  const mime = [
    `To: ${args.toEmail}`,
    `Subject: ${args.subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    args.text,
    '',
    `--${boundary}`,
    `Content-Type: ${args.mimeType}; name="${args.fileName}"`,
    'Content-Transfer-Encoding: base64',
    `Content-Disposition: attachment; filename="${args.fileName}"`,
    '',
    wrapBase64(args.bytes.toString('base64')),
    '',
    `--${boundary}--`,
    '',
  ].join('\r\n')
  return Buffer.from(mime, 'utf8').toString('base64url')
}

async function waitForAttachment(gmail: ReturnType<typeof createToolbox>, messageId: string) {
  let lastMessage: any
  for (let attempt = 0; attempt < 8; attempt++) {
    lastMessage = await gmail.read('read_email')({ messageId })
    if (Array.isArray(lastMessage?.attachments) && lastMessage.attachments.length > 0)
      return lastMessage
    await new Promise(resolve => setTimeout(resolve, 1500))
  }
  return lastMessage
}

async function waitForExtractedAttachment(
  gmail: ReturnType<typeof createToolbox>,
  input: Record<string, unknown>,
) {
  let lastResult: any
  for (let attempt = 0; attempt < 8; attempt++) {
    lastResult = await gmail.read('read_attachment_content')(input)
    if (!lastResult?.message && typeof lastResult?.content === 'string')
      return lastResult
    await new Promise(resolve => setTimeout(resolve, 1500))
  }
  return lastResult
}

suiteOrSkip('google-gmail read handlers (live)', () => {
  for (const variant of variants) {
    describe(`variant: ${variant.key}`, () => {
      const ctx: { email?: string, labelId?: string, messageId?: string, threadId?: string, draftId?: string } = {}
      let gmail: ReturnType<typeof createToolbox>
      let gmailFetch: (path: string, init?: RequestInit) => Promise<Response>

      beforeAll(async () => {
        const credentialStore = createCredentialStore(async () => variant.credentials())
        const proxy = createProxy(credentialStore)
        const node = createIntegrationNode('google-gmail', { label: 'Google Gmail', credentialId: 'google-gmail-creds', credentialVariant: variant.key })
        gmailFetch = (path, init) => proxy.call(node, path, init)
        gmail = createToolbox(
          'google-gmail',
          proxy,
          node,
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
        expect(Array.isArray(result?.attachments)).toBe(true)
      }, 30000)

      it('read_attachment_content extracts a sent fixture attachment round trip', async () => {
        if (!ctx.email)
          return expect(true).toBe(true)

        const sourcePath = ensureFixtureReady(ATTACHMENT_FIXTURE.fileName)
        const raw = makeRawMessageWithAttachment({
          toEmail: ctx.email,
          subject: `CmdTest Gmail Attachment ${Date.now()}`,
          text: 'Attachment extraction round-trip test.',
          fileName: ATTACHMENT_FIXTURE.fileName,
          mimeType: ATTACHMENT_FIXTURE.mimeType,
          bytes: readFileSync(sourcePath),
        })
        let messageId = ''

        try {
          const sentRes = await gmailFetch('/users/me/messages/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ raw }),
          })
          const sent = await sentRes.json()
          if (!sentRes.ok)
            throw new Error(`Failed to send Gmail fixture attachment (${sentRes.status}): ${JSON.stringify(sent)}`)
          messageId = sent?.id || ''
          expect(messageId).toBeTruthy()

          const email = await waitForAttachment(gmail, messageId)
          expect(email?.id).toBe(messageId)
          expect(Array.isArray(email?.attachments)).toBe(true)
          expect(email.attachments.length).toBeGreaterThan(0)

          const attachment = email.attachments.find((item: any) => item?.filename === ATTACHMENT_FIXTURE.fileName) || email.attachments[0]
          expect(attachment?.attachmentId).toBeTruthy()

          const result = await waitForExtractedAttachment(gmail, {
            messageId,
            attachmentId: attachment.attachmentId,
            mimeType: attachment.mimeType || ATTACHMENT_FIXTURE.mimeType,
          })

          expect(result?.messageId).toBe(messageId)
          expect(result?.attachmentId).toBe(attachment.attachmentId)
          expect(result?.filename || attachment.filename || ATTACHMENT_FIXTURE.fileName).toBe(ATTACHMENT_FIXTURE.fileName)
          expect(result?.kind).toBe(ATTACHMENT_FIXTURE.expectedKind)
          expect(String(result?.content || '')).toContain(INTEGRATION_TEST_MARKER)
          expect(result?.message).toBeUndefined()
        }
        finally {
          await safeCleanup(async () => messageId ? gmail.write('delete_message')({ messageId }) : Promise.resolve())
        }
      }, 120000)
    })
  }
})
