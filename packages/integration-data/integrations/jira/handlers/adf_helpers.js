function escapeMarkdown(text) {
  return String(text ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
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

  if (type === 'bulletList')
    return renderList(content, false, depth)

  if (type === 'orderedList')
    return renderList(content, true, depth)

  if (type === 'codeBlock') {
    const text = adfTextContent(node)
    return `\`\`\`\n${normalizeNewlines(text).trimEnd()}\n\`\`\``
  }

  if (type === 'rule')
    return '---'

  if (type === 'table')
    return renderTable(node)

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

export { adfToMarkdown, adfToPlainText, textToAdf }

