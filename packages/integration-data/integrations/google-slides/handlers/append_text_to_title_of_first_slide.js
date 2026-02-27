async (input) => {
  const { presentationId, text, slideIndex = 0 } = input
  const presRes = await integration.fetch(`/presentations/${encodeURIComponent(presentationId)}`)
  const pres = await presRes.json()
  const slide = (pres?.slides || [])[slideIndex]
  if (!slide)
    return { presentationId, applied: false, replies: [] }
  const titleShape = (slide.pageElements || []).find(el => el.shape?.placeholder?.type === 'TITLE')
  if (!titleShape?.objectId)
    return { presentationId, applied: false, replies: [] }
  const res = await integration.fetch(`/presentations/${encodeURIComponent(presentationId)}:batchUpdate`, {
    method: 'POST',
    body: { requests: [{ insertText: { objectId: titleShape.objectId, insertionIndex: -1, text } }] },
  })
  const out = await res.json()
  return out?.presentationId ? { ...out, applied: true } : { presentationId, applied: true, replies: out?.replies || [] }
}
