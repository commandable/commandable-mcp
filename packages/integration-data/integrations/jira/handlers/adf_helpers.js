function escapeMarkdown(text) {
  return String(text ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
}

function escapeLinkTarget(url) {
  return String(url ?? '').replace(/\)/g, '%29')
}

function normalizeNewlines(s) {
  return String(s ?? '').replace(/\r\n/g, '\n')
}

function joinBlocks(blocks) {
  const out = blocks
    .map(s => String(s ?? '').trimEnd())
    .filter(Boolean)
    .join('\n\n')
    .trim()
  return out
}

function adfTextContent(node) {
  if (!node || typeof node !== 'object')
    return ''
  if (node.type === 'text')
    return String(node.text ?? '')
  const content = Array.isArray(node.content) ? node.content : []
  return content.map(adfTextContent).join('')
}

function renderInline(node) {
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

function renderList(items, ordered, depth) {
  const lines = []
  const indent = '  '.repeat(depth)
  let idx = 1

  for (const item of items) {
    const itemContent = Array.isArray(item?.content) ? item.content : []
    const itemLines = []

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
    for (const rest of itemLines) {
      // continuation lines for the list item
      lines.push(`${indent}  ${rest}`)
    }
    idx++
  }

  return lines.join('\n').trimEnd()
}

function renderTable(tableNode) {
  const rows = Array.isArray(tableNode?.content) ? tableNode.content : []
  const mdRows = []
  const rowCells = rows.map((row) => {
    const cells = Array.isArray(row?.content) ? row.content : []
    return cells.map((cell) => {
      const cellContent = Array.isArray(cell?.content) ? cell.content : []
      const text = joinBlocks(cellContent.map(c => renderBlock(c, 0))).replace(/\n+/g, '<br/>')
      return text || ''
    })
  })

  if (!rowCells.length)
    return ''

  const header = rowCells[0]
  mdRows.push(`| ${header.map(c => c.replace(/\|/g, '\\|')).join(' | ')} |`)
  mdRows.push(`| ${header.map(() => '---').join(' | ')} |`)

  for (const row of rowCells.slice(1)) {
    mdRows.push(`| ${row.map(c => c.replace(/\|/g, '\\|')).join(' | ')} |`)
  }
  return mdRows.join('\n')
}

function renderBlock(node, depth = 0) {
  if (!node || typeof node !== 'object')
    return ''

  const type = node.type
  const content = Array.isArray(node.content) ? node.content : []

  if (type === 'paragraph') {
    return renderInline({ content })
  }

  if (type === 'heading') {
    const level = Number(node.attrs?.level || 1)
    const hashes = '#'.repeat(Math.min(Math.max(level, 1), 6))
    const text = renderInline({ content }).trim()
    return text ? `${hashes} ${text}` : ''
  }

  if (type === 'blockquote') {
    const inner = joinBlocks(content.map(c => renderBlock(c, depth)))
    if (!inner)
      return ''
    return inner.split('\n').map(line => `> ${line}`).join('\n')
  }

  if (type === 'expand' || type === 'nestedExpand') {
    const title = node.attrs?.title || 'Details'
    const inner = joinBlocks(content.map(c => renderBlock(c, depth)))
    if (!inner)
      return ''
    return `<details>\n<summary>${escapeMarkdown(title)}</summary>\n\n${inner}\n</details>`
  }

  if (type === 'bulletList')
    return renderList(content, false, depth)

  if (type === 'orderedList')
    return renderList(content, true, depth)

  if (type === 'taskList') {
    const rendered = content.map(c => renderBlock(c, depth)).filter(Boolean).join('\n')
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
    const inner = joinBlocks(content.map(c => renderBlock(c, depth)))
    if (!inner)
      return ''
    return `> ${inner.split('\n').join('\n> ')}`
  }

  // Fallback: attempt to render children as blocks or inline
  const asBlocks = joinBlocks(content.map(c => renderBlock(c, depth)))
  if (asBlocks)
    return asBlocks
  const asInline = renderInline(node)
  return asInline
}

function adfToMarkdown(adf) {
  try {
    if (!adf || typeof adf !== 'object')
      return ''
    const content = Array.isArray(adf.content) ? adf.content : []
    const out = joinBlocks(content.map(c => renderBlock(c, 0)))
    return out
  }
  catch {
    return ''
  }
}

function adfToPlainText(adf) {
  try {
    if (!adf || typeof adf !== 'object')
      return ''
    const content = Array.isArray(adf.content) ? adf.content : []
    const out = joinBlocks(content.map(c => adfTextContent(c)))
    return out
  }
  catch {
    return ''
  }
}

function textToAdf(text) {
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

import { marked } from 'marked'

function inlineTokensToAdf(inlineTokens) {
  const out = []

  const pushText = (text, marks) => {
    const t = String(text ?? '')
    if (!t)
      return
    const node = { type: 'text', text: t }
    if (marks?.length)
      node.marks = marks
    out.push(node)
  }

  const walk = (tokens, marks = []) => {
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
        // ADF media requires uploads; keep the alt text (and URL if present).
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

function blockTokensToAdf(tokens) {
  const out = []

  const walk = (toks) => {
    for (const tok of toks || []) {
      if (!tok)
        continue

      if (tok.type === 'space') {
        continue
      }

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
        const codeNode = {
          type: 'codeBlock',
          attrs: lang ? { language: lang } : {},
          content: [{ type: 'text', text: normalizeNewlines(tok.text || '') }],
        }
        out.push(codeNode)
        continue
      }

      if (tok.type === 'list') {
        const listType = tok.ordered ? 'orderedList' : 'bulletList'
        const listItems = (tok.items || []).map((item) => {
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
        const makeRow = (cells, isHeader) => ({
          type: 'tableRow',
          content: (cells || []).map((cell) => ({
            type: isHeader ? 'tableHeader' : 'tableCell',
            content: [{
              type: 'paragraph',
              content: inlineTokensToAdf(cell.tokens || [{ type: 'text', text: cell.text }]),
            }],
          })),
        })

        const headerRow = makeRow(tok.header || [], true)
        const bodyRows = (tok.rows || []).map(r => makeRow(r, false))
        out.push({ type: 'table', content: [headerRow, ...bodyRows] })
        continue
      }

      if (tok.type === 'html') {
        // Keep raw HTML as text (Jira may or may not accept it; safest is text).
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
        // Marked sometimes emits 'text' tokens containing inline content and/or additional nested tokens.
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

function markdownToAdf(markdown) {
  const src = String(markdown ?? '')
  const tokens = marked.lexer(src)
  const content = blockTokensToAdf(tokens)
  return {
    type: 'doc',
    version: 1,
    content: content.length ? content : [{ type: 'paragraph', content: [] }],
  }
}

export { adfToMarkdown, adfToPlainText, textToAdf, markdownToAdf }

