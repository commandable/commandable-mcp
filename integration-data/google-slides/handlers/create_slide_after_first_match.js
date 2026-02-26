async (input) => {
  const { presentationId, findText, layout = 'BLANK' } = input
  const presRes = await integration.fetch(`/presentations/${encodeURIComponent(presentationId)}`)
  const pres = await presRes.json()
  let targetSlideId = null
  for (const slide of (pres?.slides || [])) {
    const text = JSON.stringify(slide)
    if (text && text.includes(findText)) { targetSlideId = slide.objectId; break }
  }
  if (!targetSlideId)
    return { presentationId, applied: false, replies: [] }
  const newSlideId = `slide_${Date.now()}`
  const currentIndex = (pres?.slides || []).findIndex(s => s.objectId === targetSlideId)
  const requests = [
    { createSlide: { objectId: newSlideId, insertionIndex: currentIndex >= 0 ? currentIndex + 1 : (pres?.slides?.length || 0), slideLayoutReference: { predefinedLayout: layout } } },
  ]
  const res = await integration.fetch(`/presentations/${encodeURIComponent(presentationId)}:batchUpdate`, { method: 'POST', body: { requests } })
  const out = await res.json()
  return out?.presentationId ? { ...out, applied: true } : { presentationId, applied: true, replies: out?.replies || [] }
}
