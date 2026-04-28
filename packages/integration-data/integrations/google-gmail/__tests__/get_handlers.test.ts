import { Buffer } from 'node:buffer'
import { readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createCredentialStore, createIntegrationNode, createLiveToolCoverage, createProxy, createToolbox, safeCleanup } from '../../__tests__/liveHarness.js'
import { getPlanEntry } from '../../__tests__/liveCoveragePlan.js'

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

async function sleep(ms: number) {
  await new Promise(resolve => setTimeout(resolve, ms))
}

async function waitForAttachment(gmail: ReturnType<typeof createToolbox>, messageId: string) {
  let lastMessage: any
  for (let attempt = 0; attempt < 8; attempt++) {
    lastMessage = await gmail.read('read_email')({ messageId })
    if (Array.isArray(lastMessage?.attachments) && lastMessage.attachments.length > 0)
      return lastMessage
    await sleep(1500)
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
    await sleep(1500)
  }
  return lastResult
}

async function expectEventuallyRejects(fn: () => Promise<unknown>, label: string) {
  let lastResult: unknown
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      lastResult = await fn()
    }
    catch {
      return
    }
    await sleep(1500)
  }
  throw new Error(`Expected ${label} to become unreadable, but the last read returned: ${JSON.stringify(lastResult)}`)
}

suiteOrSkip('google-gmail handlers (live)', () => {
  for (const variant of variants) {
    describe(`variant: ${variant.key}`, () => {
      const liveCoverage = createLiveToolCoverage(getPlanEntry(`google-gmail-${variant.key.replace(/_/g, '-')}`))
      const ctx: { email?: string, labelId?: string, mutationLabelId: string } = { mutationLabelId: 'STARRED' }
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
          { coverage: liveCoverage },
        )

        const profile = await gmail.read('get_profile')({})
        ctx.email = profile?.emailAddress
        expect(ctx.email).toBeTruthy()

        const labels = await gmail.read('list_labels')({})
        ctx.labelId = labels?.labels?.[0]?.id
        ctx.mutationLabelId = labels?.labels?.find((label: any) => label?.id === 'STARRED')?.id || 'STARRED'
      }, 60000)

      afterAll(() => {
        liveCoverage.assertComplete()
      })

      it('reads mailbox metadata, labels, messages, and threads', async () => {
        const profile = await gmail.read('get_profile')({})
        expect(profile?.emailAddress || profile?.messagesTotal !== undefined).toBeTruthy()

        const labels = await gmail.read('list_labels')({})
        expect(Array.isArray(labels?.labels)).toBe(true)
        const labelId = ctx.labelId || labels?.labels?.[0]?.id
        if (labelId) {
          const label = await gmail.read('get_label')({ labelId })
          expect(label?.id).toBe(labelId)
        }

        const sent = await gmail.write('send_email')({
          to: ctx.email,
          subject: `CmdTest Gmail read ${Date.now()}`,
          body: 'Disposable message for Gmail read live tests.',
        })
        const messageId = sent?.id || ''
        expect(messageId).toBeTruthy()
        try {
          const listedMessages = await gmail.read('list_messages')({ maxResults: 10 })
          expect(listedMessages?.resultSizeEstimate !== undefined || Array.isArray(listedMessages?.messages)).toBe(true)

          const message = await gmail.read('get_message')({ messageId, format: 'full' })
          expect(message?.id).toBe(messageId)
          expect(message?.threadId).toBeTruthy()

          const email = await gmail.read('read_email')({ messageId })
          expect(email?.id).toBe(messageId)
          expect(typeof email?.subject).toBe('string')
          expect(typeof email?.from).toBe('string')
          expect(typeof email?.date).toBe('string')
          expect(typeof email?.snippet).toBe('string')
          expect(typeof email?.body).toBe('string')
          expect(Array.isArray(email?.labelIds)).toBe(true)
          expect(Array.isArray(email?.attachments)).toBe(true)

          const listedThreads = await gmail.read('list_threads')({ maxResults: 10 })
          expect(listedThreads?.resultSizeEstimate !== undefined || Array.isArray(listedThreads?.threads)).toBe(true)

          const thread = await gmail.read('get_thread')({ threadId: message.threadId, format: 'full' })
          expect(thread?.id).toBe(message.threadId)
        }
        finally {
          await safeCleanup(async () => messageId ? gmail.write('delete_message')({ messageId }) : Promise.resolve())
        }
      }, 90000)

      it('creates, reads, and deletes a draft', async () => {
        const created = await gmail.write('create_draft_email')({
          to: ctx.email,
          subject: `CmdTest Gmail Draft ${Date.now()}`,
          body: 'Draft created by integration live tests.',
        })
        const draftId = created?.id || ''
        expect(draftId).toBeTruthy()

        const drafts = await gmail.read('list_drafts')({ maxResults: 10 })
        expect(drafts?.resultSizeEstimate !== undefined || Array.isArray(drafts?.drafts)).toBe(true)

        const draft = await gmail.read('get_draft')({ draftId })
        expect(draft?.id).toBe(draftId)

        const deleted = await gmail.write('delete_draft')({ draftId })
        expect(deleted?.success === true || deleted === '').toBe(true)
      }, 60000)

      it('sends an existing draft and cleans up the sent message', async () => {
        const created = await gmail.write('create_draft_email')({
          to: ctx.email,
          subject: `CmdTest Gmail send_draft ${Date.now()}`,
          body: 'Draft sent by integration live test.',
        })
        const draftId = created?.id || ''
        expect(draftId).toBeTruthy()

        let messageId = ''
        try {
          const sent = await gmail.write('send_draft')({ draftId })
          messageId = sent?.id || ''
          expect(messageId).toBeTruthy()

          const message = await gmail.read('get_message')({ messageId, format: 'minimal' })
          expect(message?.id).toBe(messageId)
        }
        finally {
          await safeCleanup(async () => messageId ? gmail.write('delete_message')({ messageId }) : Promise.resolve())
        }
      }, 60000)

      it('sends a raw draft payload and cleans up the sent message', async () => {
        let messageId = ''
        try {
          const raw = makeRawMessage(ctx.email!, `CmdTest Gmail send_draft raw ${Date.now()}`, 'Raw payload draft-send mode.')
          const sent = await gmail.write('send_draft')({ raw })
          messageId = sent?.id || ''
          expect(messageId).toBeTruthy()

          const message = await gmail.read('get_message')({ messageId, format: 'minimal' })
          expect(message?.id).toBe(messageId)
        }
        finally {
          await safeCleanup(async () => messageId ? gmail.write('delete_message')({ messageId }) : Promise.resolve())
        }
      }, 60000)

      it('modifies, trashes, restores, and deletes a disposable message', async () => {
        const sent = await gmail.write('send_email')({
          to: ctx.email,
          subject: `CmdTest Gmail message lifecycle ${Date.now()}`,
          body: 'Disposable message for message lifecycle tools.',
        })
        const messageId = sent?.id || ''
        expect(messageId).toBeTruthy()

        const modified = await gmail.write('modify_message')({
          messageId,
          addLabelIds: [ctx.mutationLabelId],
        })
        expect(modified?.id).toBe(messageId)

        const trashed = await gmail.write('trash_message')({ messageId })
        expect(trashed?.id).toBe(messageId)

        const untrashed = await gmail.write('untrash_message')({ messageId })
        expect(untrashed?.id).toBe(messageId)

        const deleted = await gmail.write('delete_message')({ messageId })
        expect(deleted?.success === true || deleted === '').toBe(true)
        await expectEventuallyRejects(
          () => gmail.read('get_message')({ messageId, format: 'minimal' }),
          `message ${messageId}`,
        )
      }, 90000)

      it('modifies, trashes, restores, and deletes a disposable thread', async () => {
        const sent = await gmail.write('send_email')({
          to: ctx.email,
          subject: `CmdTest Gmail thread lifecycle ${Date.now()}`,
          body: 'Disposable message for thread lifecycle tools.',
        })
        const messageId = sent?.id || ''
        expect(messageId).toBeTruthy()

        const message = await gmail.read('get_message')({ messageId, format: 'minimal' })
        const threadId = message?.threadId || ''
        expect(threadId).toBeTruthy()

        const modified = await gmail.write('modify_thread')({
          threadId,
          addLabelIds: [ctx.mutationLabelId],
        })
        expect(modified?.id).toBe(threadId)

        const trashed = await gmail.write('trash_thread')({ threadId })
        expect(trashed?.id).toBe(threadId)

        const untrashed = await gmail.write('untrash_thread')({ threadId })
        expect(untrashed?.id).toBe(threadId)

        const deleted = await gmail.write('delete_thread')({ threadId })
        expect(deleted?.success === true || deleted === '').toBe(true)
        await expectEventuallyRejects(
          () => gmail.read('get_thread')({ threadId, format: 'minimal' }),
          `thread ${threadId}`,
        )
      }, 90000)

      it('creates, updates, and deletes a label', async () => {
        const created = await gmail.admin('create_label')({
          name: `CmdTest Label ${Date.now()}`,
          labelListVisibility: 'labelShow',
          messageListVisibility: 'show',
        })
        const labelId = created?.id || ''
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

      it('extracts a sent fixture attachment round trip', async () => {
        const sourcePath = ensureFixtureReady(ATTACHMENT_FIXTURE.fileName)
        const raw = makeRawMessageWithAttachment({
          toEmail: ctx.email!,
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
