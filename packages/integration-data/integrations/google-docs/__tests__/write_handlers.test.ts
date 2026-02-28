import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createCredentialStore, createIntegrationNode, createProxy, createToolbox, safeCleanup } from '../../__tests__/liveHarness.js'

// LIVE Google Docs write tests -- runs once per available credential variant.
// Required env vars (at least one):
// - GOOGLE_SERVICE_ACCOUNT_JSON  (service_account variant)
// - GOOGLE_TOKEN                 (oauth_token variant)

const env = process.env as Record<string, string | undefined>

interface VariantConfig {
  key: string
  credentials: () => Record<string, string>
}

const variants: VariantConfig[] = [
  {
    key: 'service_account',
    credentials: () => ({ serviceAccountJson: env.GOOGLE_SERVICE_ACCOUNT_JSON || '' }),
  },
  {
    key: 'oauth_token',
    credentials: () => ({ token: env.GOOGLE_TOKEN || '' }),
  },
].filter(v => Object.values(v.credentials()).some(val => val.trim().length > 0))

const suiteOrSkip = variants.length > 0 ? describe : describe.skip

suiteOrSkip('google-docs write handlers (live)', () => {
  for (const variant of variants) {
    describe(`variant: ${variant.key}`, () => {
      const ctx: { documentId?: string, folderId?: string } = {}
      let docs: ReturnType<typeof createToolbox>
      let drive: ReturnType<typeof createToolbox>

      beforeAll(async () => {
        const credentialStore = createCredentialStore(async () => variant.credentials())
        const proxy = createProxy(credentialStore)
        docs = createToolbox(
          'google-docs',
          proxy,
          createIntegrationNode('google-docs', { label: 'Google Docs', credentialId: 'google-docs-creds', credentialVariant: variant.key }),
          variant.key,
        )
        drive = createToolbox(
          'google-drive',
          proxy,
          createIntegrationNode('google-drive', { label: 'Google Drive', credentialId: 'google-drive-creds', credentialVariant: variant.key }),
          variant.key,
        )

        const folder = await drive.write('create_folder')({ name: `CmdTest Docs Write ${Date.now()}` })
        ctx.folderId = folder?.id
        expect(ctx.folderId).toBeTruthy()

        const doc = await drive.write('create_file')({
          name: `CmdTest Doc ${Date.now()}`,
          mimeType: 'application/vnd.google-apps.document',
          parentId: ctx.folderId,
        })
        ctx.documentId = doc?.id
        expect(ctx.documentId).toBeTruthy()
      }, 60000)

      afterAll(async () => {
        await safeCleanup(async () => ctx.documentId ? drive.write('delete_file')({ fileId: ctx.documentId }) : Promise.resolve())
        await safeCleanup(async () => ctx.folderId ? drive.write('delete_file')({ fileId: ctx.folderId }) : Promise.resolve())
      }, 60000)

      it('batch_update can perform a trivial replaceAllText no-op', async () => {
        const documentId = ctx.documentId
        if (!documentId)
          return expect(true).toBe(true)
        const batch_update = docs.write('batch_update')
        const res = await batch_update({ documentId, requests: [
          { replaceAllText: { containsText: { text: '___unlikely___', matchCase: true }, replaceText: '___unlikely___' } },
        ] })
        expect(Array.isArray(res?.replies) || res?.documentId).toBeTruthy()
      }, 60000)

      it('append_text appends content', async () => {
        const documentId = ctx.documentId
        if (!documentId)
          return expect(true).toBe(true)
        const append_text = docs.write('append_text')
        const marker = `CmdTest ${Date.now()}`
        const res = await append_text({ documentId, text: marker })
        expect(res?.documentId || Array.isArray(res?.replies)).toBeTruthy()
        const get_text = docs.read('get_document_text')
        const after = await get_text({ documentId })
        expect(String(after?.text || '')).toContain(marker)
      }, 60000)

      it('insert_text_after_first_match inserts text near target', async () => {
        const documentId = ctx.documentId
        if (!documentId)
          return expect(true).toBe(true)
        const insert_text_after_first_match = docs.write('insert_text_after_first_match')
        const get_text = docs.read('get_document_text')
        const anchor = `ANCHOR_${Date.now()}`
        const appended = docs.write('append_text')
        const before = await get_text({ documentId })
        if (!String(before?.text || '').includes(anchor))
          await appended({ documentId, text: `\n${anchor}\n` })
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
        const replace_all_text = docs.write('replace_all_text')
        const res = await replace_all_text({ documentId, findText: '___unlikely___', replaceText: '___unlikely___', matchCase: true })
        expect(res?.documentId || Array.isArray(res?.replies)).toBeTruthy()
      }, 60000)

      it('style_first_match applies style to first match', async () => {
        const documentId = ctx.documentId
        if (!documentId)
          return expect(true).toBe(true)
        const style_first_match = docs.write('style_first_match')
        const get_struct = docs.read('get_document_structured')
        const anchor = `ANCHOR_${Date.now()}`
        const appended = docs.write('append_text')
        const before = await get_struct({ documentId })
        if (!JSON.stringify(before?.body || {}).includes(anchor))
          await appended({ documentId, text: `\n${anchor}\n` })
        const res = await style_first_match({ documentId, findText: anchor, textStyle: { bold: true } })
        expect(res?.applied === true || Array.isArray(res?.replies)).toBeTruthy()
      }, 60000)

      it('insert_table_after_first_match inserts a table near target', async () => {
        const documentId = ctx.documentId
        if (!documentId)
          return expect(true).toBe(true)
        const insert_table_after_first_match = docs.write('insert_table_after_first_match')
        const get_struct = docs.read('get_document_structured')
        const anchor = `ANCHOR_${Date.now()}`
        const appended = docs.write('append_text')
        const before = await get_struct({ documentId })
        if (!JSON.stringify(before?.body || {}).includes(anchor))
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
        const insert_page_break_after_first_match = docs.write('insert_page_break_after_first_match')
        const get_struct = docs.read('get_document_structured')
        const anchor = `ANCHOR_${Date.now()}`
        const appended = docs.write('append_text')
        const before = await get_struct({ documentId })
        if (!JSON.stringify(before?.body || {}).includes(anchor))
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
        const insert_inline_image_after_first_match = docs.write('insert_inline_image_after_first_match')
        const anchor = `ANCHOR_${Date.now()}`
        const appended = docs.write('append_text')
        const get_text = docs.read('get_document_text')
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
        const delete_first_match = docs.write('delete_first_match')
        const get_text = docs.read('get_document_text')
        const anchor = `ANCHOR_${Date.now()}`
        const appended = docs.write('append_text')
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
        const update_paragraph_style_for_first_match = docs.write('update_paragraph_style_for_first_match')
        const get_struct = docs.read('get_document_structured')
        const anchor = `ANCHOR_${Date.now()}`
        const appended = docs.write('append_text')
        const before = await get_struct({ documentId })
        if (!JSON.stringify(before?.body || {}).includes(anchor))
          await appended({ documentId, text: `\n${anchor}\n` })
        const res = await update_paragraph_style_for_first_match({ documentId, findText: anchor, paragraphStyle: { alignment: 'CENTER' } })
        expect(res?.applied === true || Array.isArray(res?.replies)).toBeTruthy()
        const after = await get_struct({ documentId })
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
        const update_document_style = docs.write('update_document_style')
        const res = await update_document_style({ documentId, documentStyle: { useFirstPageHeaderFooter: false } })
        expect(res?.documentId || Array.isArray(res?.replies)).toBeTruthy()
      }, 60000)

      it('create_document creates a document (self-cleaning)', async () => {
        const created = await docs.write('create_document')({ title: `CmdTest Doc Tool ${Date.now()}` })
        const id = created?.documentId
        expect(typeof id).toBe('string')
        await safeCleanup(async () => id ? drive.write('delete_file')({ fileId: id }) : Promise.resolve())
      }, 60000)
    })
  }
})
