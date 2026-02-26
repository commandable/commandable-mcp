import { beforeAll, describe, expect, it } from 'vitest'
import { IntegrationProxy } from '../../../src/integrations/proxy.js'
import { loadIntegrationTools } from '../../../src/integrations/dataLoader.js'

// LIVE Google Docs write tests using managed OAuth
// Required env vars:
// - COMMANDABLE_MANAGED_OAUTH_BASE_URL
// - COMMANDABLE_MANAGED_OAUTH_SECRET_KEY
// - GDOCS_TEST_CONNECTION_ID (managed OAuth connection for provider 'google-docs')
// - GDOCS_TEST_DOCUMENT_ID (target document ID with write access) OR GDOCS_ALLOW_CREATE to create

interface Ctx {
  documentId?: string
}

describe('google-docs write handlers (live)', () => {
  const env = process.env as Record<string, string>
  const ctx: Ctx = {}
  let buildWriteHandler: (name: string) => ((input: any) => Promise<any>)
  let buildReadHandler: (name: string) => ((input: any) => Promise<any>)

  beforeAll(async () => {
    const { COMMANDABLE_MANAGED_OAUTH_BASE_URL, COMMANDABLE_MANAGED_OAUTH_SECRET_KEY, GDOCS_TEST_CONNECTION_ID, GDOCS_TEST_DOCUMENT_ID } = env

    if (!COMMANDABLE_MANAGED_OAUTH_BASE_URL || !COMMANDABLE_MANAGED_OAUTH_SECRET_KEY || !GDOCS_TEST_CONNECTION_ID) {
      console.warn('Skipping live Google Docs write tests: missing required env vars')
      expect(false).toBe(true)
      return
    }

    const proxy = new IntegrationProxy({
      managedOAuthBaseUrl: COMMANDABLE_MANAGED_OAUTH_BASE_URL,
      managedOAuthSecretKey: COMMANDABLE_MANAGED_OAUTH_SECRET_KEY,
    })
    const integrationNode = { id: 'node-gdocs', type: 'google-docs', label: 'Google Docs', connectionId: GDOCS_TEST_CONNECTION_ID } as any

    const tools = loadIntegrationTools('google-docs')
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

    ctx.documentId = GDOCS_TEST_DOCUMENT_ID
  }, 60000)

  it('create_document creates a document when allowed', async () => {
    if (!process.env.GDOCS_ALLOW_CREATE)
      return expect(true).toBe(true)
    const create_document = buildWriteHandler('create_document')
    const res = await create_document({ title: `CmdTest Doc ${Date.now()}` })
    expect(res?.documentId).toBeTruthy()
  }, 60000)

  it('batch_update can perform a trivial replaceAllText no-op', async () => {
    const documentId = process.env.GDOCS_TEST_DOCUMENT_ID
    if (!documentId)
      return expect(true).toBe(true)
    const batch_update = buildWriteHandler('batch_update')
    const res = await batch_update({ documentId, requests: [
      { replaceAllText: { containsText: { text: '___unlikely___', matchCase: true }, replaceText: '___unlikely___' } },
    ] })
    expect(Array.isArray(res?.replies) || res?.documentId).toBeTruthy()
  }, 60000)

  it('append_text appends content', async () => {
    const documentId = process.env.GDOCS_TEST_DOCUMENT_ID
    if (!documentId)
      return expect(true).toBe(true)
    const append_text = buildWriteHandler('append_text')
    const marker = `CmdTest ${Date.now()}`
    const res = await append_text({ documentId, text: marker })
    expect(res?.documentId || Array.isArray(res?.replies)).toBeTruthy()
    const get_text = buildReadHandler('get_document_text')
    const after = await get_text({ documentId })
    expect(String(after?.text || '')).toContain(marker)
  }, 60000)

  it('insert_text_after_first_match inserts text near target', async () => {
    const documentId = process.env.GDOCS_TEST_DOCUMENT_ID
    if (!documentId)
      return expect(true).toBe(true)
    const insert_text_after_first_match = buildWriteHandler('insert_text_after_first_match')
    const get_text = buildReadHandler('get_document_text')
    const anchor = `ANCHOR_${Date.now()}`
    const appended = buildWriteHandler('append_text')
    const before = await get_text({ documentId })
    if (!String(before?.text || '').includes(anchor)) {
      await appended({ documentId, text: `\n${anchor}\n` })
    }
    const insertSnippet = ` CmdTest ${Date.now()} `
    const res = await insert_text_after_first_match({ documentId, findText: anchor, insertText: insertSnippet, position: 'after' })
    expect(res?.applied === true || Array.isArray(res?.replies)).toBeTruthy()
    const after = await get_text({ documentId })
    const text = String(after?.text || '')
    expect(text).toContain(anchor)
    expect(text).toContain(insertSnippet)
  }, 60000)

  it('replace_all_text replaces occurrences', async () => {
    const documentId = process.env.GDOCS_TEST_DOCUMENT_ID
    if (!documentId)
      return expect(true).toBe(true)
    const replace_all_text = buildWriteHandler('replace_all_text')
    const res = await replace_all_text({ documentId, findText: '___unlikely___', replaceText: '___unlikely___', matchCase: true })
    expect(res?.documentId || Array.isArray(res?.replies)).toBeTruthy()
  }, 60000)

  it('style_first_match applies style to first match', async () => {
    const documentId = process.env.GDOCS_TEST_DOCUMENT_ID
    if (!documentId)
      return expect(true).toBe(true)
    const style_first_match = buildWriteHandler('style_first_match')
    const get_struct = buildReadHandler('get_document_structured')
    const anchor = `ANCHOR_${Date.now()}`
    const appended = buildWriteHandler('append_text')
    const before = await get_struct({ documentId })
    const hasAnchorBefore = JSON.stringify(before?.body || {}).includes(anchor)
    if (!hasAnchorBefore)
      await appended({ documentId, text: `\n${anchor}\n` })
    const res = await style_first_match({ documentId, findText: anchor, textStyle: { bold: true } })
    expect(res?.applied === true || Array.isArray(res?.replies)).toBeTruthy()
  }, 60000)

  it('insert_table_after_first_match inserts a table near target', async () => {
    const documentId = process.env.GDOCS_TEST_DOCUMENT_ID
    if (!documentId)
      return expect(true).toBe(true)
    const insert_table_after_first_match = buildWriteHandler('insert_table_after_first_match')
    const get_struct = buildReadHandler('get_document_structured')
    const anchor = `ANCHOR_${Date.now()}`
    const appended = buildWriteHandler('append_text')
    const before = await get_struct({ documentId })
    const hasAnchorBefore = JSON.stringify(before?.body || {}).includes(anchor)
    if (!hasAnchorBefore)
      await appended({ documentId, text: `\n${anchor}\n` })
    const res = await insert_table_after_first_match({ documentId, findText: anchor, rows: 1, columns: 1 })
    expect(res?.applied === true || Array.isArray(res?.replies)).toBeTruthy()
    const after = await get_struct({ documentId })
    const hasTable = (after?.body?.content || []).some((el: any) => Boolean(el.table))
    expect(hasTable).toBe(true)
  }, 60000)

  it('insert_page_break_after_first_match inserts a break near target', async () => {
    const documentId = process.env.GDOCS_TEST_DOCUMENT_ID
    if (!documentId)
      return expect(true).toBe(true)
    const insert_page_break_after_first_match = buildWriteHandler('insert_page_break_after_first_match')
    const get_struct = buildReadHandler('get_document_structured')
    const anchor = `ANCHOR_${Date.now()}`
    const appended = buildWriteHandler('append_text')
    const before = await get_struct({ documentId })
    const hasAnchorBefore = JSON.stringify(before?.body || {}).includes(anchor)
    if (!hasAnchorBefore)
      await appended({ documentId, text: `\n${anchor}\n` })
    const res = await insert_page_break_after_first_match({ documentId, findText: anchor })
    expect(res?.applied === true || Array.isArray(res?.replies)).toBeTruthy()
    const after = await get_struct({ documentId })
    const hasBreak = (after?.body?.content || []).some((el: any) => Boolean(el.sectionBreak))
    expect(hasBreak).toBe(true)
  }, 60000)

  it('insert_inline_image_after_first_match inserts an image when allowed', async () => {
    if (!process.env.GDOCS_TEST_DOCUMENT_ID || !process.env.GDOCS_TEST_IMAGE_URI)
      return expect(true).toBe(true)
    const documentId = process.env.GDOCS_TEST_DOCUMENT_ID
    const insert_inline_image_after_first_match = buildWriteHandler('insert_inline_image_after_first_match')
    const anchor = `ANCHOR_${Date.now()}`
    const appended = buildWriteHandler('append_text')
    const get_text = buildReadHandler('get_document_text')
    const before = await get_text({ documentId })
    if (!String(before?.text || '').includes(anchor))
      await appended({ documentId, text: `\n${anchor}\n` })
    const res = await insert_inline_image_after_first_match({ documentId, findText: anchor, uri: process.env.GDOCS_TEST_IMAGE_URI!, altText: 'CmdTest' })
    expect(res?.applied === true || Array.isArray(res?.replies)).toBeTruthy()
  }, 60000)

  it('delete_first_match deletes a small span (no-op ok)', async () => {
    const documentId = process.env.GDOCS_TEST_DOCUMENT_ID
    if (!documentId)
      return expect(true).toBe(true)
    const delete_first_match = buildWriteHandler('delete_first_match')
    const get_text = buildReadHandler('get_document_text')
    const anchor = `ANCHOR_${Date.now()}`
    const appended = buildWriteHandler('append_text')
    const before = await get_text({ documentId })
    if (!String(before?.text || '').includes(anchor))
      await appended({ documentId, text: `\n${anchor}\n` })
    const res = await delete_first_match({ documentId, findText: anchor })
    expect(res?.applied === true || Array.isArray(res?.replies)).toBeTruthy()
    const after = await get_text({ documentId })
    expect(String(after?.text || '')).not.toContain(anchor)
  }, 60000)

  it('update_paragraph_style_for_first_match updates paragraph style near target', async () => {
    const documentId = process.env.GDOCS_TEST_DOCUMENT_ID
    if (!documentId)
      return expect(true).toBe(true)
    const update_paragraph_style_for_first_match = buildWriteHandler('update_paragraph_style_for_first_match')
    const get_struct = buildReadHandler('get_document_structured')
    const anchor = `ANCHOR_${Date.now()}`
    const appended = buildWriteHandler('append_text')
    const before = await get_struct({ documentId })
    const hasAnchorBefore = JSON.stringify(before?.body || {}).includes(anchor)
    if (!hasAnchorBefore)
      await appended({ documentId, text: `\n${anchor}\n` })
    const res = await update_paragraph_style_for_first_match({ documentId, findText: anchor, paragraphStyle: { alignment: 'CENTER' } })
    expect(res?.applied === true || Array.isArray(res?.replies)).toBeTruthy()
    const after = await get_struct({ documentId })
    // find the paragraph containing anchor and verify alignment
    let foundAligned = false
    for (const el of (after?.body?.content || [])) {
      if (!el.paragraph)
        continue
      const p = el.paragraph
      const text = (p.elements || []).map((e: any) => e?.textRun?.content || '').join('')
      if (text.includes(anchor)) {
        if (p.paragraphStyle?.alignment === 'CENTER')
          foundAligned = true
        break
      }
    }
    expect(foundAligned).toBe(true)
  }, 60000)

  it('update_document_style updates doc style with no-op', async () => {
    const documentId = process.env.GDOCS_TEST_DOCUMENT_ID
    if (!documentId)
      return expect(true).toBe(true)
    const update_document_style = buildWriteHandler('update_document_style')
    const res = await update_document_style({ documentId, documentStyle: { useFirstPageHeaderFooter: false } })
    expect(res?.documentId || Array.isArray(res?.replies)).toBeTruthy()
  }, 60000)
})
