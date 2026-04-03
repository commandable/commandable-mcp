async (input) => {
  const { presentationId, findText, textStyle, fields } = input
  // Replace first match with a marker to derive objectId/range
  const marker = `__CMD_MARK_${Date.now()}__`
  const rep = await integration.fetch(`/presentations/${encodeURIComponent(presentationId)}:batchUpdate`, {
    method: 'POST',
    body: { requests: [{ replaceAllText: { containsText: { text: findText, matchCase: false }, replaceText: marker } }] },
  })
  await rep.json()
  // Scan pages for marker and apply style to that range on the text element
  const presRes = await integration.fetch(`/presentations/${encodeURIComponent(presentationId)}`)
  const pres = await presRes.json()
  let targetObjectId = null
  let startIndex = -1
  let endIndex = -1
  for (const slide of (pres?.slides || [])) {
    for (const el of (slide.pageElements || [])) {
      const text = el.shape?.text
      if (!text)
        continue
      for (const pe of (text.textElements || [])) {
        const t = pe.textRun?.content
        if (!t)
          continue
        const idx = t.indexOf(marker)
        if (idx >= 0) {
          targetObjectId = el.objectId
          startIndex = (pe.startIndex || 0) + idx
          endIndex = startIndex + marker.length
          break
        }
      }
      if (targetObjectId)
        break
    }
    if (targetObjectId)
      break
  }
  if (!targetObjectId)
    return { presentationId, applied: false, replies: [] }
  const requests = [
    { updateTextStyle: { objectId: targetObjectId, style: textStyle, textRange: { type: 'FIXED_RANGE', startIndex, endIndex }, fields: fields || Object.keys(textStyle || {}).join(',') } },
    { replaceAllText: { containsText: { text: marker, matchCase: true }, replaceText: findText } },
  ]
  const res = await integration.fetch(`/presentations/${encodeURIComponent(presentationId)}:batchUpdate`, { method: 'POST', body: { requests } })
  const out = await res.json()
  return out?.presentationId ? { ...out, applied: true } : { presentationId, applied: true, replies: out?.replies || [] }
}
