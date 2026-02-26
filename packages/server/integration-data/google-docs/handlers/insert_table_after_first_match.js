async (input) => {
  const { documentId, findText, rows, columns, position } = input
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
  if (baseIndex < 0) {
    const confirm = await integration.fetch(`/documents/${encodeURIComponent(documentId)}`)
    const got = await confirm.json()
    return { documentId: got?.documentId || documentId, applied: false, replies: [] }
  }

  const requests = []
  requests.push({ insertTable: { location: { index: baseIndex }, rows, columns } })
  requests.push({ replaceAllText: { containsText: { text: marker, matchCase: true }, replaceText: findText } })
  const res = await integration.fetch(`/documents/${encodeURIComponent(documentId)}:batchUpdate`, { method: 'POST', body: { requests } })
  const out = await res.json()
  if (out?.documentId || Array.isArray(out?.replies))
    return { ...out, applied: true }
  const confirm = await integration.fetch(`/documents/${encodeURIComponent(documentId)}`)
  const got = await confirm.json()
  return { documentId: got?.documentId || documentId, applied: true, replies: Array.isArray(out?.replies) ? out.replies : [] }
}
