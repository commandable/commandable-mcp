import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { IntegrationProxy } from '../../../../server/src/integrations/proxy.js'
import { loadIntegrationTools } from '../../../../server/src/integrations/dataLoader.js'

// LIVE Google Docs write tests using credentials
// Required env vars:
// - Either GOOGLE_TOKEN, OR GOOGLE_SERVICE_ACCOUNT_JSON
// - GOOGLE_DOCS_TEST_DOCUMENT_ID (target document ID with write access) OR GDOCS_ALLOW_CREATE to create

interface Ctx {
  documentId?: string
  folderId?: string
}

const env = process.env as Record<string, string>
const hasEnv = (...keys: string[]) => keys.every(k => !!env[k] && env[k].trim().length > 0)
const suite = (hasEnv('GOOGLE_TOKEN') || hasEnv('GOOGLE_SERVICE_ACCOUNT_JSON'))
  ? describe
  : describe.skip

suite('google-docs write handlers (live)', () => {
  const ctx: Ctx = {}
  let buildWriteHandler: (name: string) => ((input: any) => Promise<any>)
  let buildReadHandler: (name: string) => ((input: any) => Promise<any>)
  let buildDriveWrite: (name: string) => ((input: any) => Promise<any>)

  beforeAll(async () => {
    const credentialStore = {
      getCredentials: async () => ({
        token: env.GOOGLE_TOKEN || '',
        serviceAccountJson: env.GOOGLE_SERVICE_ACCOUNT_JSON || '',
      }),
    }

    const proxy = new IntegrationProxy({ credentialStore })
    const docsNode = {
      spaceId: 'ci',
      id: 'node-gdocs',
      referenceId: 'node-gdocs',
      type: 'google-docs',
      label: 'Google Docs',
      connectionMethod: 'credentials',
      credentialId: 'google-docs-creds',
    } as any
    const driveNode = {
      spaceId: 'ci',
      id: 'node-gdrive',
      referenceId: 'node-gdrive',
      type: 'google-drive',
      label: 'Google Drive',
      connectionMethod: 'credentials',
      credentialId: 'google-drive-creds',
    } as any

    const tools = loadIntegrationTools('google-docs')
    expect(tools).toBeTruthy()

    const driveTools = loadIntegrationTools('google-drive')
    expect(driveTools).toBeTruthy()

    buildWriteHandler = (name: string) => {
      const tool = tools!.write.find(t => t.name === name)
      expect(tool, `write tool ${name} exists`).toBeTruthy()
      const integration = { fetch: (path: string, init?: RequestInit) => proxy.call(docsNode, path, init) }
      const build = new Function('integration', `return (${tool!.handlerCode});`)
      return build(integration) as (input: any) => Promise<any>
    }

    buildReadHandler = (name: string) => {
      const tool = tools!.read.find(t => t.name === name)
      expect(tool, `read tool ${name} exists`).toBeTruthy()
      const integration = { fetch: (path: string, init?: RequestInit) => proxy.call(docsNode, path, init) }
      const build = new Function('integration', `return (${tool!.handlerCode});`)
      return build(integration) as (input: any) => Promise<any>
    }

    buildDriveWrite = (name: string) => {
      const tool = driveTools!.write.find(t => t.name === name)
      expect(tool, `drive tool ${name} exists`).toBeTruthy()
      const integration = { fetch: (path: string, init?: RequestInit) => proxy.call(driveNode, path, init) }
      const build = new Function('integration', `return (${tool!.handlerCode});`)
      return build(integration) as (input: any) => Promise<any>
    }

    // Create dedicated folder + doc for this run
    const create_folder = buildDriveWrite('create_folder')
    const folder = await create_folder({ name: `CmdTest Docs Write ${Date.now()}` })
    ctx.folderId = folder?.id
    expect(ctx.folderId).toBeTruthy()

    const create_document = buildWriteHandler('create_document')
    const doc = await create_document({ title: `CmdTest Doc ${Date.now()}` })
    ctx.documentId = doc?.documentId
    expect(ctx.documentId).toBeTruthy()

    const move_file = buildDriveWrite('move_file')
    await move_file({ fileId: ctx.documentId, addParents: ctx.folderId })
  }, 60000)

  afterAll(async () => {
    try {
      if (ctx.documentId) {
        const delete_file = buildDriveWrite('delete_file')
        await delete_file({ fileId: ctx.documentId })
      }
    }
    catch {}
    try {
      if (ctx.folderId) {
        const delete_file = buildDriveWrite('delete_file')
        await delete_file({ fileId: ctx.folderId })
      }
    }
    catch {}
  }, 60000)

  it('batch_update can perform a trivial replaceAllText no-op', async () => {
    const documentId = ctx.documentId
    if (!documentId)
      return expect(true).toBe(true)
    const batch_update = buildWriteHandler('batch_update')
    const res = await batch_update({ documentId, requests: [
      { replaceAllText: { containsText: { text: '___unlikely___', matchCase: true }, replaceText: '___unlikely___' } },
    ] })
    expect(Array.isArray(res?.replies) || res?.documentId).toBeTruthy()
  }, 60000)

  it('append_text appends content', async () => {
    const documentId = ctx.documentId
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
    const documentId = ctx.documentId
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
    const documentId = ctx.documentId
    if (!documentId)
      return expect(true).toBe(true)
    const replace_all_text = buildWriteHandler('replace_all_text')
    const res = await replace_all_text({ documentId, findText: '___unlikely___', replaceText: '___unlikely___', matchCase: true })
    expect(res?.documentId || Array.isArray(res?.replies)).toBeTruthy()
  }, 60000)

  it('style_first_match applies style to first match', async () => {
    const documentId = ctx.documentId
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
    const documentId = ctx.documentId
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
    const documentId = ctx.documentId
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
    if (!ctx.documentId || !process.env.GDOCS_TEST_IMAGE_URI)
      return expect(true).toBe(true)
    const documentId = ctx.documentId
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
    const documentId = ctx.documentId
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
    const documentId = ctx.documentId
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
    const documentId = ctx.documentId
    if (!documentId)
      return expect(true).toBe(true)
    const update_document_style = buildWriteHandler('update_document_style')
    const res = await update_document_style({ documentId, documentStyle: { useFirstPageHeaderFooter: false } })
    expect(res?.documentId || Array.isArray(res?.replies)).toBeTruthy()
  }, 60000)
})
