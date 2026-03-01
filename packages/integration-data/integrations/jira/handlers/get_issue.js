(() => {
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
    if (type === 'heading') {
      const level = Number(node.attrs?.level || 1)
      const hashes = '#'.repeat(Math.min(Math.max(level, 1), 6))
      const text = renderInline({ content }).trim()
      return text ? `${hashes} ${text}` : ''
    }
    if (type === 'codeBlock') {
      const text = adfTextContent(node)
      return `\`\`\`\n${normalizeNewlines(text).trimEnd()}\n\`\`\``
    }
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
    const defaultFields = [
      'summary',
      'status',
      'assignee',
      'priority',
      'issuetype',
      'project',
      'description',
      'created',
      'updated',
      'labels',
    ]

    const fields = Array.isArray(input.fields) && input.fields.length ? input.fields : defaultFields
    const params = new URLSearchParams()
    if (fields?.length)
      params.set('fields', fields.join(','))
    if (Array.isArray(input.expand) && input.expand.length)
      params.set('expand', input.expand.join(','))

    const path = `/rest/api/3/issue/${encodeURIComponent(input.issueIdOrKey)}${params.toString() ? `?${params.toString()}` : ''}`
    const res = await integration.fetch(path)
    const data = await res.json()

    const descAdf = data?.fields?.description
    const descMarkdown = adfToMarkdown(descAdf)
    const descText = descMarkdown ? '' : adfToPlainText(descAdf)

    return {
      id: data.id ?? null,
      key: data.key ?? null,
      self: data.self ?? null,
      summary: data.fields?.summary ?? null,
      status: data.fields?.status
        ? {
            id: data.fields.status.id ?? null,
            name: data.fields.status.name ?? null,
            category: data.fields.status.statusCategory
              ? {
                  key: data.fields.status.statusCategory.key ?? null,
                  name: data.fields.status.statusCategory.name ?? null,
                }
              : null,
          }
        : null,
      assignee: data.fields?.assignee
        ? {
            accountId: data.fields.assignee.accountId ?? null,
            displayName: data.fields.assignee.displayName ?? null,
          }
        : null,
      priority: data.fields?.priority ? { id: data.fields.priority.id ?? null, name: data.fields.priority.name ?? null } : null,
      issueType: data.fields?.issuetype ? { id: data.fields.issuetype.id ?? null, name: data.fields.issuetype.name ?? null } : null,
      project: data.fields?.project ? { id: data.fields.project.id ?? null, key: data.fields.project.key ?? null, name: data.fields.project.name ?? null } : null,
      labels: Array.isArray(data.fields?.labels) ? data.fields.labels : [],
      descriptionMarkdown: descMarkdown || null,
      descriptionText: descMarkdown ? null : (descText || null),
      created: data.fields?.created ?? null,
      updated: data.fields?.updated ?? null,
    }
  }
})()

