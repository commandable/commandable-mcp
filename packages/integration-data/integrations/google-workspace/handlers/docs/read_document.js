async (input) => {
  const MONO_FONTS = new Set([
    'Courier',
    'Courier New',
    'Consolas',
    'Menlo',
    'Monaco',
    'Roboto Mono',
    'Source Code Pro',
  ])

  const HEADING_MAP = {
    TITLE: '#',
    SUBTITLE: '##',
    HEADING_1: '#',
    HEADING_2: '##',
    HEADING_3: '###',
    HEADING_4: '####',
    HEADING_5: '#####',
    HEADING_6: '######',
  }

  const BULLET_GLYPHS = new Set([
    'BULLET_DISC_CIRCLE_SQUARE',
    'BULLET_DIAMONDX_ARROW3D_SQUARE',
    'BULLET_CHECKBOX',
    'BULLET_ARROW_DIAMOND_DISC',
    'BULLET_STAR_CIRCLE_SQUARE',
  ])

  const LIST_NUMBER_GLYPHS = new Set([
    'DECIMAL',
    'ZERO_DECIMAL',
    'UPPER_ALPHA',
    'ALPHA',
    'UPPER_ROMAN',
    'ROMAN',
  ])

  const trimEndWhitespace = (value) => (value || '').replace(/[ \t]+$/g, '')

  const escapeCell = (value) =>
    String(value ?? '')
      .replace(/\|/g, '\\|')
      .replace(/\r?\n/g, '<br>')

  const extractPlainTextFromParagraph = (paragraph) => {
    let text = ''
    for (const element of paragraph?.elements || []) {
      text += element?.textRun?.content || ''
    }
    return trimEndWhitespace(text)
  }

  const applyTextStyle = (text, textStyle = {}) => {
    const raw = (text || '').replace(/\n/g, '')
    if (!raw) return ''

    let out = raw
    if (textStyle.link?.url) out = `[${out}](${textStyle.link.url})`

    const fontFamily = textStyle.weightedFontFamily?.fontFamily || ''
    const isMono = textStyle.smallCaps || MONO_FONTS.has(fontFamily)

    if (isMono) out = `\`${out}\``
    if (textStyle.bold) out = `**${out}**`
    if (textStyle.italic) out = `*${out}*`
    if (textStyle.strikethrough) out = `~~${out}~~`

    return out
  }

  const paragraphToMarkdown = (paragraph, docLists) => {
    const styleType = paragraph?.paragraphStyle?.namedStyleType
    const headingPrefix = HEADING_MAP[styleType] || ''

    let line = ''
    for (const element of paragraph?.elements || []) {
      line += applyTextStyle(element?.textRun?.content || '', element?.textRun?.textStyle || {})
    }
    line = trimEndWhitespace(line)

    if (!line) return ''

    const bullet = paragraph?.bullet
    if (bullet) {
      const nestingLevel = bullet.nestingLevel || 0
      const listMeta = docLists?.[bullet.listId]
      const nesting = listMeta?.listProperties?.nestingLevels?.[nestingLevel]
      const glyphType = nesting?.glyphType || ''
      const isNumbered = LIST_NUMBER_GLYPHS.has(glyphType) && !BULLET_GLYPHS.has(glyphType)
      const indent = '  '.repeat(Math.max(0, nestingLevel))
      return `${indent}${isNumbered ? '1.' : '-'} ${line}`
    }

    if (headingPrefix) return `${headingPrefix} ${line}`
    return line
  }

  const tableToMarkdown = (table, docLists) => {
    const rows = table?.tableRows || []
    if (!rows.length) return ''

    const normalized = rows.map((row) =>
      (row?.tableCells || []).map((cell) => {
        const parts = []
        for (const c of cell?.content || []) {
          if (c?.paragraph) {
            const p = paragraphToMarkdown(c.paragraph, docLists)
            if (p) parts.push(p)
          }
        }
        return escapeCell(parts.join('<br>'))
      }),
    )

    const width = Math.max(...normalized.map((r) => r.length), 1)
    const padded = normalized.map((r) => [...r, ...Array(width - r.length).fill('')])
    const header = padded[0] || Array(width).fill('')
    const separator = Array(width).fill('---')
    const body = padded.slice(1)

    const lines = [
      `| ${header.join(' | ')} |`,
      `| ${separator.join(' | ')} |`,
      ...body.map((r) => `| ${r.join(' | ')} |`),
    ]
    return lines.join('\n')
  }

  const docToPlainText = (docBodyContent) => {
    const lines = []
    for (const item of docBodyContent || []) {
      if (item?.paragraph) {
        const text = extractPlainTextFromParagraph(item.paragraph)
        if (text) lines.push(text)
      } else if (item?.table) {
        for (const row of item.table.tableRows || []) {
          const cells = (row.tableCells || []).map((cell) => {
            const pieces = []
            for (const contentItem of cell.content || []) {
              if (contentItem?.paragraph) {
                const text = extractPlainTextFromParagraph(contentItem.paragraph)
                if (text) pieces.push(text)
              }
            }
            return pieces.join(' ')
          })
          if (cells.some(Boolean)) lines.push(cells.join(' | '))
        }
      }
    }
    return lines.join('\n\n').trim()
  }

  const { documentId } = input
  const res = await integration.fetch(`/documents/${encodeURIComponent(documentId)}`)
  const doc = await res.json()

  const content = doc?.body?.content || []
  const lists = doc?.lists || {}

  const blocks = []
  for (const item of content) {
    if (item?.paragraph) {
      const line = paragraphToMarkdown(item.paragraph, lists)
      if (line) blocks.push(line)
    } else if (item?.table) {
      const table = tableToMarkdown(item.table, lists)
      if (table) blocks.push(table)
    }
  }

  const markdown = blocks.join('\n\n').trim()
  if (markdown) {
    return {
      documentId: doc?.documentId || documentId,
      title: doc?.title || '',
      markdown,
    }
  }

  // Escape hatch: return plain text if markdown conversion produced nothing.
  return {
    documentId: doc?.documentId || documentId,
    title: doc?.title || '',
    markdown: docToPlainText(content),
  }
}
