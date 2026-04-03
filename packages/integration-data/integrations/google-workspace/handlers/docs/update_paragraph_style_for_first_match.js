async (input) => {
  const { documentId, findText, paragraphStyle, fields } = input
  const marker = `__CMD_MARK_${Date.now()}__`
  const replaceRes = await integration.fetch(`/documents/${encodeURIComponent(documentId)}:batchUpdate`, {
    method: 'POST',
    body: { requests: [{ replaceAllText: { containsText: { text: findText, matchCase: false }, replaceText: marker } }] },
  })
  await replaceRes.json()

  const getRes = await integration.fetch(`/documents/${encodeURIComponent(documentId)}`)
  const doc = await getRes.json()
  let paragraphStart = -1
  let paragraphEnd = -1
  for (const el of (doc?.body?.content || [])) {
    const p = el.paragraph
    if (!p)
      continue
    for (const e of (p.elements || [])) {
      const t = e?.textRun?.content
      if (!t)
        continue
      const idx = t.indexOf(marker)
      if (idx >= 0) {
        paragraphStart = p.elements?.[0]?.startIndex || e.startIndex || 1
        paragraphEnd = (p.elements?.[p.elements.length - 1]?.endIndex) || (e.endIndex) || (paragraphStart + marker.length)
        break
      }
    }
    if (paragraphStart >= 0)
      break
  }
  if (paragraphStart < 0) {
    const confirm = await integration.fetch(`/documents/${encodeURIComponent(documentId)}`)
    const got = await confirm.json()
    return { documentId: got?.documentId || documentId, applied: false, replies: [] }
  }

  const requests = []
  requests.push({ updateParagraphStyle: { range: { startIndex: paragraphStart, endIndex: paragraphEnd }, paragraphStyle, fields: fields || Object.keys(paragraphStyle || {}).join(',') } })
  requests.push({ replaceAllText: { containsText: { text: marker, matchCase: true }, replaceText: findText } })
  const res = await integration.fetch(`/documents/${encodeURIComponent(documentId)}:batchUpdate`, { method: 'POST', body: { requests } })
  const out = await res.json()
  if (out?.documentId || Array.isArray(out?.replies))
    return { ...out, applied: true }
  const confirm = await integration.fetch(`/documents/${encodeURIComponent(documentId)}`)
  const got = await confirm.json()
  return { documentId: got?.documentId || documentId, applied: true, replies: Array.isArray(out?.replies) ? out.replies : [] }
}
