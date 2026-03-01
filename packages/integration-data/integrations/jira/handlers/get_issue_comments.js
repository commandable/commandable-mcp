(() => {
  function escapeMarkdown(text) {
    return String(text ?? '')
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
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
    const content = Array.isArray(node.content) ? node.content : []
    return content.map(renderInline).join('')
  }

  function renderBlock(node) {
    if (!node || typeof node !== 'object')
      return ''
    const type = node.type
    const content = Array.isArray(node.content) ? node.content : []
    if (type === 'paragraph')
      return renderInline({ content })
    const inner = joinBlocks(content.map(renderBlock))
    return inner || renderInline(node)
  }

  function adfToMarkdown(adf) {
    try {
      if (!adf || typeof adf !== 'object')
        return ''
      const content = Array.isArray(adf.content) ? adf.content : []
      return joinBlocks(content.map(renderBlock))
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
      return joinBlocks(content.map(adfTextContent))
    }
    catch {
      return ''
    }
  }

  return async (input) => {
    const params = new URLSearchParams()
    params.set('startAt', String(input.startAt ?? 0))
    params.set('maxResults', String(input.maxResults ?? 50))

    const path = `/rest/api/3/issue/${encodeURIComponent(input.issueIdOrKey)}/comment?${params.toString()}`
    const res = await integration.fetch(path)
    const data = await res.json()
    const comments = Array.isArray(data.comments) ? data.comments : []

    return {
      startAt: data.startAt ?? (input.startAt ?? 0),
      maxResults: data.maxResults ?? (input.maxResults ?? 50),
      total: data.total ?? comments.length,
      comments: comments.map((c) => {
        const md = adfToMarkdown(c.body)
        const text = md ? '' : adfToPlainText(c.body)
        return {
          id: c.id ?? null,
          created: c.created ?? null,
          updated: c.updated ?? null,
          author: c.author
            ? { accountId: c.author.accountId ?? null, displayName: c.author.displayName ?? null }
            : null,
          bodyMarkdown: md || null,
          bodyText: md ? null : (text || null),
        }
      }),
    }
  }
})()

