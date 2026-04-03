async (input) => {
  const { documentId, findText, insertText, position } = input
  const marker = `__CMD_MARK_${Date.now()}__`
  // Replace first occurrence by marker only (simulate single by replacing all, then revert later to first span)
  const replaceRes = await integration.fetch(`/documents/${encodeURIComponent(documentId)}:batchUpdate`, {
    method: 'POST',
    body: { requests: [{ replaceAllText: { containsText: { text: findText, matchCase: false }, replaceText: marker } }] },
  })
  await replaceRes.json()

  const getRes = await integration.fetch(`/documents/${encodeURIComponent(documentId)}`)
  const doc = await getRes.json()
  let insertIndex = -1
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
        insertIndex = position === 'before' ? startIndex : endIndex
        break
      }
    }
    if (insertIndex >= 0)
      break
  }
  if (insertIndex < 0) {
    const confirm = await integration.fetch(`/documents/${encodeURIComponent(documentId)}`)
    const got = await confirm.json()
    return { documentId: got?.documentId || documentId, applied: false, replies: [] }
  }

  const requests = []
  requests.push({ insertText: { text: insertText, location: { index: insertIndex } } })
  // restore marker back to original findText everywhere
  requests.push({ replaceAllText: { containsText: { text: marker, matchCase: true }, replaceText: findText } })
  const res = await integration.fetch(`/documents/${encodeURIComponent(documentId)}:batchUpdate`, { method: 'POST', body: { requests } })
  const out = await res.json()
  if (out?.documentId || Array.isArray(out?.replies))
    return { ...out, applied: true }
  const confirm = await integration.fetch(`/documents/${encodeURIComponent(documentId)}`)
  const got = await confirm.json()
  return { documentId: got?.documentId || documentId, applied: true, replies: Array.isArray(out?.replies) ? out.replies : [] }
}
