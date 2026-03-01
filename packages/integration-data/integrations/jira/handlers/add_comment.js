(() => {
  function normalizeNewlines(s) {
    return String(s ?? '').replace(/\r\n/g, '\n')
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

  return async (input) => {
    const res = await integration.fetch(`/rest/api/3/issue/${encodeURIComponent(input.issueIdOrKey)}/comment`, {
      method: 'POST',
      body: { body: textToAdf(input.bodyText) },
    })

    return await res.json()
  }
})()

