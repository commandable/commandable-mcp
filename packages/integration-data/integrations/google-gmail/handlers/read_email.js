async (input) => {
  const userId = encodeURIComponent(input.userId || 'me')
  const messageId = encodeURIComponent(input.messageId)
  const res = await integration.fetch(`/users/${userId}/messages/${messageId}?format=full`)
  const msg = await res.json()

  const getHeader = (name) => {
    const h = (msg.payload?.headers || []).find(h => h.name.toLowerCase() === name.toLowerCase())
    return h?.value || ''
  }

  const decodeBase64url = (data) => {
    if (!data) return ''
    try {
      return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
    }
    catch {
      return ''
    }
  }

  // Recursively extract text body, preferring text/plain over text/html
  const extractBody = (part) => {
    if (!part) return ''
    if (part.mimeType === 'text/plain' && part.body?.data)
      return decodeBase64url(part.body.data)
    if (part.parts) {
      // Depth-first: try text/plain first across all parts
      for (const p of part.parts) {
        if (p.mimeType === 'text/plain' && p.body?.data)
          return decodeBase64url(p.body.data)
      }
      // Recurse into nested multipart
      for (const p of part.parts) {
        const text = extractBody(p)
        if (text) return text
      }
    }
    if (part.mimeType === 'text/html' && part.body?.data)
      return decodeBase64url(part.body.data)
    return ''
  }

  return {
    id: msg.id,
    threadId: msg.threadId,
    labelIds: msg.labelIds || [],
    subject: getHeader('Subject'),
    from: getHeader('From'),
    to: getHeader('To'),
    cc: getHeader('Cc'),
    date: getHeader('Date'),
    snippet: msg.snippet || '',
    body: extractBody(msg.payload),
  }
}
