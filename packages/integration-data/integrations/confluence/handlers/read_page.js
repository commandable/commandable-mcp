(() => {
  const decodeHtmlEntities = (s) => {
    if (!s) return ''
    return String(s)
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x([0-9a-fA-F]+);/g, (_m, hex) => {
        try { return String.fromCodePoint(parseInt(hex, 16)) } catch { return '' }
      })
      .replace(/&#([0-9]+);/g, (_m, dec) => {
        try { return String.fromCodePoint(parseInt(dec, 10)) } catch { return '' }
      })
  }

  const tokenize = (html) => {
    const tokens = []
    const re = /<!--[\s\S]*?-->|<\/?[^>]+>|[^<]+/g
    const raw = String(html || '')
    let m
    while ((m = re.exec(raw))) {
      const t = m[0]
      if (!t) continue
      if (t.startsWith('<!--')) continue
      if (t[0] === '<') {
        const isClose = /^<\//.test(t)
        const tagMatch = t.match(/^<\/?\s*([a-zA-Z0-9:_-]+)/)
        const name = (tagMatch?.[1] || '').toLowerCase()
        const attrs = {}
        if (!isClose) {
          const attrRe = /([a-zA-Z0-9:_-]+)\s*=\s*"([^"]*)"/g
          let am
          while ((am = attrRe.exec(t))) attrs[am[1].toLowerCase()] = am[2]
        }
        const isSelfClosing = /\/\s*>$/.test(t) || ['br', 'hr'].includes(name)
        tokens.push({ type: 'tag', name, isClose, isSelfClosing, attrs })
      }
      else {
        tokens.push({ type: 'text', value: t })
      }
    }
    return tokens
  }

  const xhtmlToText = (html) => {
    const out = []
    const tokens = tokenize(html)
    for (const tok of tokens) {
      if (tok.type === 'text') {
        out.push(decodeHtmlEntities(tok.value))
        continue
      }
      if (tok.type === 'tag') {
        if (tok.name === 'br') out.push('\n')
        if (tok.isClose && ['p', 'div', 'section', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'tr'].includes(tok.name))
          out.push('\n')
      }
    }
    return out.join('').replace(/\n{3,}/g, '\n\n').trim()
  }

  const xhtmlToMarkdown = (html) => {
    const tokens = tokenize(html)
    const out = []

    const listStack = []
    const linkStack = []
    let inPre = false
    let inCode = false

    const push = (s) => { if (s) out.push(s) }

    for (const tok of tokens) {
      if (tok.type === 'text') {
        const text = decodeHtmlEntities(tok.value)
        if (!text) continue
        push(inPre ? text : text.replace(/\s+/g, ' '))
        continue
      }

      if (tok.type !== 'tag') continue

      const { name, isClose, isSelfClosing, attrs } = tok

      if (name === 'br' && !isClose) { push('\n'); continue }

      if (/^h[1-6]$/.test(name)) {
        const level = Number(name.slice(1))
        if (!isClose) push(`\n\n${'#'.repeat(level)} `)
        else push('\n\n')
        continue
      }

      if (name === 'p' || name === 'div' || name === 'section') {
        if (!isClose) push('\n\n')
        else push('\n\n')
        continue
      }

      if (name === 'strong' || name === 'b') { push('**'); continue }
      if (name === 'em' || name === 'i') { push('*'); continue }

      if (name === 'pre') {
        if (!isClose) { inPre = true; push('\n\n```\n') }
        else { inPre = false; push('\n```\n\n') }
        continue
      }

      if (name === 'code') {
        if (inPre) continue
        if (!isClose) { inCode = true; push('`') }
        else { inCode = false; push('`') }
        continue
      }

      if (name === 'a') {
        if (!isClose) {
          linkStack.push(attrs?.href || '')
          push('[')
        }
        else {
          const href = linkStack.pop() || ''
          push(`](${href})`)
        }
        continue
      }

      if (name === 'ul' || name === 'ol') {
        if (!isClose) listStack.push(name)
        else listStack.pop()
        if (isClose) push('\n')
        continue
      }

      if (name === 'li') {
        if (!isClose) {
          const indent = '  '.repeat(Math.max(0, listStack.length - 1))
          const bullet = listStack[listStack.length - 1] === 'ol' ? '1.' : '-'
          push(`\n${indent}${bullet} `)
        }
        else {
          push('\n')
        }
        continue
      }

      if (name === 'hr' && !isClose) { push('\n\n---\n\n'); continue }
      if (name === 'table') { if (!isClose) push('\n\n'); else push('\n\n'); continue }
      if (name === 'tr') { if (!isClose) push('\n'); continue }
      if (name === 'th' || name === 'td') {
        if (!isClose) push('| ')
        else push(' ')
        continue
      }

      // Ignore Confluence-specific macro/container tags but keep their text content.
      if (name.startsWith('ac:') || name.startsWith('ri:'))
        continue

      if (isSelfClosing)
        continue
    }

    const md = out.join('')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\|\s*\n/g, '|\n')
      .trim()

    return md
  }

  const buildWebUrl = (links) => {
    const base = links?.base
    const webui = links?.webui
    if (!webui) return null
    if (/^https?:\/\//.test(webui)) return webui
    if (base && /^https?:\/\//.test(base)) {
      try { return new URL(webui, base).toString() } catch {}
    }
    return webui
  }

  return async (input) => {
    const pageId = encodeURIComponent(String(input.pageId))

    const params = new URLSearchParams()
    params.set('body-format', 'storage')
    if (input.includeLabels) params.set('include-labels', 'true')
    if (input.includeProperties) params.set('include-properties', 'true')

    const res = await integration.fetch(`/wiki/api/v2/pages/${pageId}?${params}`)
    const data = await res.json()

    const storage = data?.body?.storage
    const storageValue = typeof storage === 'string'
      ? storage
      : (typeof storage?.value === 'string' ? storage.value : '')

    const contentMarkdown = xhtmlToMarkdown(storageValue)
    const contentText = xhtmlToText(storageValue)

    return {
      id: data?.id,
      title: data?.title,
      spaceId: data?.spaceId,
      parentId: data?.parentId,
      status: data?.status,
      version: data?.version?.number,
      createdAt: data?.createdAt,
      webUrl: buildWebUrl(data?._links),
      labels: data?.labels?.results,
      contentMarkdown: contentMarkdown || null,
      contentText: contentText || null,
      links: data?._links || {},
    }
  }
})()

