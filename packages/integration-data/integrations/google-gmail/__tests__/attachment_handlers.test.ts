import { describe, expect, it, vi } from 'vitest'
import { createSafeHandlerFromString } from '../../../../core/src/integrations/sandbox.js'
import { buildSandboxUtils } from '../../../../core/src/integrations/sandboxUtils.js'
import { loadIntegrationTools } from '../../../src/loader.js'

function gmailReadTool(name: string) {
  const tool = loadIntegrationTools('google-gmail')?.read.find(tool => tool.name === name)
  if (!tool)
    throw new Error(`Missing google-gmail read tool: ${name}`)
  return tool
}

async function runGmailHandler(
  name: string,
  input: Record<string, unknown>,
  opts: {
    fetch: (path: string, init?: RequestInit) => Promise<Response>
    extractFileContent?: (args: any) => Promise<any>
  },
) {
  const tool = gmailReadTool(name)
  const getIntegration = () => ({ fetch: opts.fetch })
  const wrapper = `async (input) => {
  const integration = getIntegration('gmail');
  const __inner = ${tool.handlerCode};
  return await __inner(input);
}`
  const utils = buildSandboxUtils([], {
    extractFileContent: opts.extractFileContent || (async () => ({ kind: 'text', content: '' })),
  })
  const safeHandler = createSafeHandlerFromString(wrapper, getIntegration, utils)
  const result = await safeHandler(input)
  if (!result.success)
    throw result.result
  return result.result
}

const gmailMessage = {
  id: 'msg-1',
  threadId: 'thread-1',
  labelIds: ['INBOX'],
  snippet: 'Attached report',
  payload: {
    headers: [
      { name: 'Subject', value: 'Report' },
      { name: 'From', value: 'sender@example.com' },
      { name: 'To', value: 'recipient@example.com' },
      { name: 'Date', value: 'Mon, 1 Jan 2024 00:00:00 +0000' },
    ],
    mimeType: 'multipart/mixed',
    parts: [
      {
        partId: '0',
        mimeType: 'multipart/alternative',
        parts: [
          {
            partId: '0.0',
            mimeType: 'text/plain',
            body: { data: Buffer.from('Hello body', 'utf8').toString('base64url') },
          },
        ],
      },
      {
        partId: '1',
        filename: 'report.pdf',
        mimeType: 'application/pdf',
        body: { attachmentId: 'att-1', size: 123 },
      },
    ],
  },
}

describe('google-gmail attachment handlers', () => {
  it('read_email returns recursive attachment metadata', async () => {
    const result = await runGmailHandler('read_email', { messageId: 'msg-1' }, {
      fetch: vi.fn(async () => new Response(JSON.stringify(gmailMessage), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })),
    })

    expect(result.id).toBe('msg-1')
    expect(result.body).toBe('Hello body')
    expect(result.attachments).toEqual([
      {
        attachmentId: 'att-1',
        filename: 'report.pdf',
        mimeType: 'application/pdf',
        size: 123,
        partId: '1',
      },
    ])
  })

  it('read_attachment_content resolves by attachmentId and extracts a data URL', async () => {
    const extractFileContent = vi.fn(async () => ({ kind: 'pdf', content: 'Extracted report text' }))
    const fetch = vi.fn(async (path: string) => {
      if (path.includes('/attachments/att-1')) {
        return new Response(JSON.stringify({
          attachmentId: 'att-1',
          data: Buffer.from('pdf bytes', 'utf8').toString('base64url'),
          size: 123,
        }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      }
      return new Response(JSON.stringify(gmailMessage), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    })

    const result = await runGmailHandler('read_attachment_content', {
      messageId: 'msg-1',
      attachmentId: 'att-1',
    }, { fetch, extractFileContent })

    expect(fetch).toHaveBeenCalledWith('/users/me/messages/msg-1?format=full')
    expect(fetch).toHaveBeenCalledWith('/users/me/messages/msg-1/attachments/att-1')
    expect(extractFileContent).toHaveBeenCalledWith({
      auth: false,
      source: `data:application/pdf;base64,${Buffer.from('pdf bytes', 'utf8').toString('base64')}`,
      previewPages: 0,
    })
    expect(result).toMatchObject({
      messageId: 'msg-1',
      attachmentId: 'att-1',
      filename: 'report.pdf',
      mimeType: 'application/pdf',
      kind: 'pdf',
      content: 'Extracted report text',
    })
  })

  it('read_attachment_content resolves by filename', async () => {
    const extractFileContent = vi.fn(async () => ({ kind: 'pdf', content: 'Extracted by filename' }))
    const fetch = vi.fn(async (path: string) => {
      if (path.includes('/attachments/att-1')) {
        return new Response(JSON.stringify({
          data: Buffer.from('pdf bytes', 'utf8').toString('base64url'),
        }), { status: 200 })
      }
      return new Response(JSON.stringify(gmailMessage), { status: 200 })
    })

    const result = await runGmailHandler('read_attachment_content', {
      messageId: 'msg-1',
      filename: 'report.pdf',
    }, { fetch, extractFileContent })

    expect(result.attachmentId).toBe('att-1')
    expect(result.content).toBe('Extracted by filename')
  })
})
