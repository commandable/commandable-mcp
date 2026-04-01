import TurndownService from 'turndown'
import { marked } from 'marked'

export type SandboxUtils = {
  html?: {
    toMarkdown: (html: string) => string
    toText: (html: string) => string
    fromMarkdown: (markdown: string) => string
  }
  adf?: {
    toMarkdown: (adf: any) => string
    toPlainText: (adf: any) => string
    fromText: (text: string) => any
    fromMarkdown: (markdown: string) => any
  }
}

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
})

function decodeHtmlEntities(s: any) {
  if (!s)
    return ''
  return String(s)
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, '\'')
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, hex) => {
      try { return String.fromCodePoint(parseInt(hex, 16)) } catch { return '' }
    })
    .replace(/&#([0-9]+);/g, (_m, dec) => {
      try { return String.fromCodePoint(parseInt(dec, 10)) } catch { return '' }
    })
}

function stripTagsToText(html: any) {
  const raw = String(html || '')
  const noTags = raw
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|section|h[1-6]|li|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
  return decodeHtmlEntities(noTags)
    .replace(/[ \t]+\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function escapeMarkdown(text: any) {
  return String(text ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
}

function escapeLinkTarget(url: any) {
  return String(url ?? '').replace(/\)/g, '%29')
}

function normalizeNewlines(s: any) {
  return String(s ?? '').replace(/\r\n/g, '\n')
}

function joinBlocks(blocks: any[]) {
  const out = blocks
    .map(s => String(s ?? '').trimEnd())
    .filter(Boolean)
    .join('\n\n')
    .trim()
  return out
}

function adfTextContent(node: any): string {
  if (!node || typeof node !== 'object')
    return ''
  if (node.type === 'text')
    return String(node.text ?? '')
  const content = Array.isArray(node.content) ? node.content : []
  return content.map(adfTextContent).join('')
}

function renderInline(node: any): string {
  if (!node || typeof node !== 'object')
    return ''

  if (node.type === 'text') {
    let text = escapeMarkdown(node.text ?? '')
    const marks = Array.isArray(node.marks) ? node.marks : []
    for (const m of marks) {
      if (!m || typeof m !== 'object')
        continue
      if (m.type === 'strong') text = `**${text}**`
      else if (m.type === 'em') text = `*${text}*`
      else if (m.type === 'strike') text = `~~${text}~~`
      else if (m.type === 'code') text = `\`${text}\``
      else if (m.type === 'link') {
        const href = m.attrs?.href
        if (href)
          text = `[${text}](${href})`
      }
    }
    return text
  }

  if (node.type === 'hardBreak')
    return '\n'

  if (node.type === 'inlineCard') {
    const url = node.attrs?.url
    return url ? `<${escapeMarkdown(url)}>` : ''
  }

  if (node.type === 'mention') {
    const text = node.attrs?.text || node.attrs?.displayName || node.attrs?.id || '@mention'
    return escapeMarkdown(text)
  }

  if (node.type === 'emoji') {
    const shortName = node.attrs?.shortName
    return shortName ? escapeMarkdown(shortName) : ''
  }

  const content = Array.isArray(node.content) ? node.content : []
  return content.map(renderInline).join('')
}

function renderList(items: any[], ordered: boolean, depth: number) {
  const lines: string[] = []
  const indent = '  '.repeat(depth)
  let idx = 1

  for (const item of items) {
    const itemContent = Array.isArray(item?.content) ? item.content : []
    const itemLines: string[] = []

    for (const c of itemContent) {
      if (c?.type === 'paragraph') {
        const text = renderInline({ content: c.content || [] }).trim()
        if (text)
          itemLines.push(text)
      }
      else if (c?.type === 'bulletList') {
        const nested = renderList(Array.isArray(c.content) ? c.content : [], false, depth + 1)
        if (nested)
          itemLines.push(nested)
      }
      else if (c?.type === 'orderedList') {
        const nested = renderList(Array.isArray(c.content) ? c.content : [], true, depth + 1)
        if (nested)
          itemLines.push(nested)
      }
      else {
        const text = renderBlock(c, depth + 1)
        if (text)
          itemLines.push(text)
      }
    }

    const bullet = ordered ? `${idx}. ` : '- '
    const first = itemLines.shift() || ''
    lines.push(`${indent}${bullet}${first}`)
    for (const rest of itemLines)
      lines.push(`${indent}  ${rest}`)
    idx++
  }

  return lines.join('\n').trimEnd()
}

function renderTable(tableNode: any) {
  const rows = Array.isArray(tableNode?.content) ? tableNode.content : []
  const mdRows: string[] = []
  const rowCells = rows.map((row: any) => {
    const cells = Array.isArray(row?.content) ? row.content : []
    return cells.map((cell: any) => {
      const cellContent = Array.isArray(cell?.content) ? cell.content : []
      const text = joinBlocks(cellContent.map((c: any) => renderBlock(c, 0))).replace(/\n+/g, '<br/>')
      return text || ''
    })
  })

  if (!rowCells.length)
    return ''

  const header = rowCells[0]
  mdRows.push(`| ${header.map((c: string) => c.replace(/\|/g, '\\|')).join(' | ')} |`)
  mdRows.push(`| ${header.map(() => '---').join(' | ')} |`)

  for (const row of rowCells.slice(1))
    mdRows.push(`| ${row.map((c: string) => c.replace(/\|/g, '\\|')).join(' | ')} |`)
  return mdRows.join('\n')
}

function renderBlock(node: any, depth = 0): string {
  if (!node || typeof node !== 'object')
    return ''

  const type = node.type
  const content = Array.isArray(node.content) ? node.content : []

  if (type === 'paragraph')
    return renderInline({ content })

  if (type === 'heading') {
    const level = Number(node.attrs?.level || 1)
    const hashes = '#'.repeat(Math.min(Math.max(level, 1), 6))
    const text = renderInline({ content }).trim()
    return text ? `${hashes} ${text}` : ''
  }

  if (type === 'blockquote') {
    const inner = joinBlocks(content.map((c: any) => renderBlock(c, depth)))
    if (!inner)
      return ''
    return inner.split('\n').map(line => `> ${line}`).join('\n')
  }

  if (type === 'expand' || type === 'nestedExpand') {
    const title = node.attrs?.title || 'Details'
    const inner = joinBlocks(content.map((c: any) => renderBlock(c, depth)))
    if (!inner)
      return ''
    return `<details>\n<summary>${escapeMarkdown(title)}</summary>\n\n${inner}\n</details>`
  }

  if (type === 'bulletList')
    return renderList(content, false, depth)

  if (type === 'orderedList')
    return renderList(content, true, depth)

  if (type === 'taskList') {
    const rendered = content.map((c: any) => renderBlock(c, depth)).filter(Boolean).join('\n')
    return rendered.trimEnd()
  }

  if (type === 'taskItem') {
    const checked = node.attrs?.state === 'DONE'
    const indent = '  '.repeat(depth)
    const inner = renderInline({ content }).trim()
    return `${indent}- [${checked ? 'x' : ' '}] ${inner}`.trimEnd()
  }

  if (type === 'codeBlock') {
    const text = adfTextContent(node)
    const lang = node.attrs?.language ? String(node.attrs.language) : ''
    return `\`\`\`${lang}\n${normalizeNewlines(text).trimEnd()}\n\`\`\``
  }

  if (type === 'rule')
    return '---'

  if (type === 'table')
    return renderTable(node)

  if (type === 'blockCard') {
    const url = node.attrs?.url
    return url ? `<${escapeMarkdown(url)}>` : ''
  }

  if (type === 'panel') {
    const inner = joinBlocks(content.map((c: any) => renderBlock(c, depth)))
    if (!inner)
      return ''
    return `> ${inner.split('\n').join('\n> ')}`
  }

  const asBlocks = joinBlocks(content.map((c: any) => renderBlock(c, depth)))
  if (asBlocks)
    return asBlocks
  return renderInline(node)
}

function adfToMarkdown(adf: any) {
  try {
    if (!adf || typeof adf !== 'object')
      return ''
    const content = Array.isArray(adf.content) ? adf.content : []
    return joinBlocks(content.map((c: any) => renderBlock(c, 0)))
  }
  catch {
    return ''
  }
}

function adfToPlainText(adf: any) {
  try {
    if (!adf || typeof adf !== 'object')
      return ''
    const content = Array.isArray(adf.content) ? adf.content : []
    return joinBlocks(content.map((c: any) => adfTextContent(c)))
  }
  catch {
    return ''
  }
}

function textToAdf(text: any) {
  const s = normalizeNewlines(text || '').trim()
  if (!s) {
    return {
      type: 'doc',
      version: 1,
      content: [{ type: 'paragraph', content: [] }],
    }
  }

  const paragraphs = s.split(/\n{2,}/g).map(p => p.trim()).filter(Boolean)
  return {
    type: 'doc',
    version: 1,
    content: paragraphs.map(p => ({
      type: 'paragraph',
      content: [{ type: 'text', text: p }],
    })),
  }
}

function inlineTokensToAdf(inlineTokens: any[]) {
  const out: any[] = []

  const pushText = (text: any, marks?: any[]) => {
    const t = String(text ?? '')
    if (!t)
      return
    const node: any = { type: 'text', text: t }
    if (marks?.length)
      node.marks = marks
    out.push(node)
  }

  const walk = (tokens: any[], marks: any[] = []) => {
    for (const tok of tokens || []) {
      if (!tok)
        continue
      if (tok.type === 'text') {
        pushText(tok.text, marks)
      }
      else if (tok.type === 'strong') {
        walk(tok.tokens || [], [...marks, { type: 'strong' }])
      }
      else if (tok.type === 'em') {
        walk(tok.tokens || [], [...marks, { type: 'em' }])
      }
      else if (tok.type === 'del') {
        walk(tok.tokens || [], [...marks, { type: 'strike' }])
      }
      else if (tok.type === 'codespan') {
        pushText(tok.text, [...marks, { type: 'code' }])
      }
      else if (tok.type === 'br') {
        out.push({ type: 'hardBreak' })
      }
      else if (tok.type === 'link') {
        const href = tok.href ? String(tok.href) : ''
        const nextMarks = href ? [...marks, { type: 'link', attrs: { href: escapeLinkTarget(href) } }] : marks
        walk(tok.tokens || [{ type: 'text', text: tok.text }], nextMarks)
      }
      else if (tok.type === 'image') {
        const alt = tok.text ? String(tok.text) : ''
        const href = tok.href ? String(tok.href) : ''
        const label = alt || href
        if (label)
          pushText(label, marks)
      }
      else if (Array.isArray(tok.tokens)) {
        walk(tok.tokens, marks)
      }
      else if (tok.raw) {
        pushText(tok.raw, marks)
      }
    }
  }

  walk(inlineTokens, [])
  return out
}

function blockTokensToAdf(tokens: any[]) {
  const out: any[] = []

  const walk = (toks: any[]) => {
    for (const tok of toks || []) {
      if (!tok)
        continue

      if (tok.type === 'space')
        continue

      if (tok.type === 'heading') {
        out.push({
          type: 'heading',
          attrs: { level: Math.min(Math.max(Number(tok.depth || 1), 1), 6) },
          content: inlineTokensToAdf(tok.tokens || [{ type: 'text', text: tok.text }]),
        })
        continue
      }

      if (tok.type === 'paragraph') {
        out.push({
          type: 'paragraph',
          content: inlineTokensToAdf(tok.tokens || [{ type: 'text', text: tok.text }]),
        })
        continue
      }

      if (tok.type === 'blockquote') {
        const innerBlocks = blockTokensToAdf(tok.tokens || [])
        out.push({ type: 'blockquote', content: innerBlocks.length ? innerBlocks : [{ type: 'paragraph', content: [] }] })
        continue
      }

      if (tok.type === 'hr') {
        out.push({ type: 'rule' })
        continue
      }

      if (tok.type === 'code') {
        const lang = tok.lang ? String(tok.lang) : undefined
        out.push({
          type: 'codeBlock',
          attrs: lang ? { language: lang } : {},
          content: [{ type: 'text', text: normalizeNewlines(tok.text || '') }],
        })
        continue
      }

      if (tok.type === 'list') {
        const listType = tok.ordered ? 'orderedList' : 'bulletList'
        const listItems = (tok.items || []).map((item: any) => {
          const itemBlocks = blockTokensToAdf(item.tokens || [])
          return {
            type: 'listItem',
            content: itemBlocks.length ? itemBlocks : [{ type: 'paragraph', content: [] }],
          }
        })
        out.push({ type: listType, content: listItems })
        continue
      }

      if (tok.type === 'table') {
        const makeRow = (cells: any[], isHeader: boolean) => ({
          type: 'tableRow',
          content: (cells || []).map((cell: any) => ({
            type: isHeader ? 'tableHeader' : 'tableCell',
            content: [{
              type: 'paragraph',
              content: inlineTokensToAdf(cell.tokens || [{ type: 'text', text: cell.text }]),
            }],
          })),
        })

        const headerRow = makeRow(tok.header || [], true)
        const bodyRows = (tok.rows || []).map((r: any) => makeRow(r, false))
        out.push({ type: 'table', content: [headerRow, ...bodyRows] })
        continue
      }

      if (tok.type === 'html') {
        const raw = String(tok.text || tok.raw || '').trim()
        if (raw) {
          out.push({
            type: 'paragraph',
            content: [{ type: 'text', text: raw }],
          })
        }
        continue
      }

      if (tok.type === 'text') {
        const hasNested = Array.isArray(tok.tokens) && tok.tokens.length
        if (hasNested) {
          out.push({ type: 'paragraph', content: inlineTokensToAdf(tok.tokens) })
        }
        else if (tok.text) {
          out.push({ type: 'paragraph', content: [{ type: 'text', text: String(tok.text) }] })
        }
        continue
      }

      if (Array.isArray(tok.tokens)) {
        walk(tok.tokens)
        continue
      }

      if (tok.raw) {
        const raw = String(tok.raw).trim()
        if (raw)
          out.push({ type: 'paragraph', content: [{ type: 'text', text: raw }] })
      }
    }
  }

  walk(tokens)
  return out
}

function markdownToAdf(markdown: any) {
  const src = String(markdown ?? '')
  const tokens = marked.lexer(src)
  const content = blockTokensToAdf(tokens as any[])
  return {
    type: 'doc',
    version: 1,
    content: content.length ? content : [{ type: 'paragraph', content: [] }],
  }
}

export function buildSandboxUtils(bundles?: string[]): SandboxUtils {
  const enabled = new Set((bundles || []).filter(Boolean))
  const utils: SandboxUtils = {}

  if (enabled.has('html')) {
    utils.html = {
      toMarkdown: (html: string) => {
        try { return turndown.turndown(String(html ?? '')) } catch { return '' }
      },
      toText: (html: string) => {
        try { return stripTagsToText(html) } catch { return '' }
      },
      fromMarkdown: (md: string) => {
        try { return marked.parse(String(md ?? ''), { async: false }) as string } catch { return '' }
      },
    }
  }

  if (enabled.has('adf')) {
    utils.adf = {
      toMarkdown: adfToMarkdown,
      toPlainText: adfToPlainText,
      fromText: textToAdf,
      fromMarkdown: markdownToAdf,
    }
  }

  return utils
}

/**
 * Resolves the `utils` object passed to integration handler sandboxes.
 * When `inject` is defined, it is the **full** utils object — the host is responsible for
 * composition (e.g. `{ ...buildSandboxUtils(['html']), ...appUtils }`).
 * When `inject` is undefined, manifest `utils` bundles are applied via {@link buildSandboxUtils}.
 */
export function resolveSandboxUtils(
  bundles: string[] | undefined,
  inject: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (inject !== undefined)
    return inject
  return buildSandboxUtils(bundles) as Record<string, unknown>
}

