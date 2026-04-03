async (input) => {
  const { documentId, findText, textStyle, fields } = input
  // 1) Find first match via replaceAllText with unique marker
  const marker = `__CMD_MARK_${Date.now()}__`
  const replaceRes = await integration.fetch(`/documents/${encodeURIComponent(documentId)}:batchUpdate`, {
    method: 'POST',
    body: { requests: [{ replaceAllText: { containsText: { text: findText, matchCase: false }, replaceText: marker } }] },
  })
  const rep = await replaceRes.json()
  // 2) Get doc, locate marker, compute indices
  const getRes = await integration.fetch(`/documents/${encodeURIComponent(documentId)}`)
  const doc = await getRes.json()
  let startIndex = -1
  let endIndex = -1
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
        startIndex = elStart + idx
        endIndex = startIndex + marker.length
        break
      }
    }
    if (startIndex >= 0)
      break
  }
  if (startIndex < 0)
    return rep
  // 3) Apply style and restore original text
  const requests = []
  requests.push({ updateTextStyle: { range: { startIndex, endIndex }, textStyle, fields: fields || Object.keys(textStyle || {}).join(',') } })
  requests.push({ replaceAllText: { containsText: { text: marker, matchCase: true }, replaceText: findText } })
  const res = await integration.fetch(`/documents/${encodeURIComponent(documentId)}:batchUpdate`, { method: 'POST', body: { requests } })
  return await res.json()
}
