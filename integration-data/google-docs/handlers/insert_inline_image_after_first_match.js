async (input) => {
  const { documentId, findText, uri, altText, position } = input
  const marker = `__CMD_MARK_${Date.now()}__`
  const replaceRes = await integration.fetch(`/documents/${encodeURIComponent(documentId)}:batchUpdate`, {
    method: 'POST',
    body: { requests: [{ replaceAllText: { containsText: { text: findText, matchCase: false }, replaceText: marker } }] },
  })
  await replaceRes.json()

  const getRes = await integration.fetch(`/documents/${encodeURIComponent(documentId)}`)
  const doc = await getRes.json()
  let baseIndex = -1
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
        const elStart = e.startIndex || 1
        const startIndex = elStart + idx
        const endIndex = startIndex + marker.length
        baseIndex = position === 'before' ? startIndex : endIndex
        break
      }
    }
    if (baseIndex >= 0)
      break
  }
  if (baseIndex < 0)
    return { ok: true }

  const requests = []
  requests.push({ insertInlineImage: { location: { index: baseIndex }, uri, altTextTitle: altText } })
  requests.push({ replaceAllText: { containsText: { text: marker, matchCase: true }, replaceText: findText } })
  const res = await integration.fetch(`/documents/${encodeURIComponent(documentId)}:batchUpdate`, { method: 'POST', body: { requests } })
  return await res.json()
}
