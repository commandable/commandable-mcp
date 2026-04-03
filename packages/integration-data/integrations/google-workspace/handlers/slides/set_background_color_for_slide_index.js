async (input) => {
  const { presentationId, slideIndex, rgbColor } = input
  const presRes = await integration.fetch(`/presentations/${encodeURIComponent(presentationId)}`)
  const pres = await presRes.json()
  const slide = (pres?.slides || [])[slideIndex]
  if (!slide?.objectId)
    return { presentationId, applied: false, replies: [] }
  const color = { color: { rgbColor } }
  const res = await integration.fetch(`/presentations/${encodeURIComponent(presentationId)}:batchUpdate`, {
    method: 'POST',
    body: { requests: [{ updatePageProperties: { objectId: slide.objectId, pageProperties: { pageBackgroundFill: { solidFill: color } }, fields: 'pageBackgroundFill.solidFill.color' } }] },
  })
  const out = await res.json()
  return out?.presentationId ? { ...out, applied: true } : { presentationId, applied: true, replies: out?.replies || [] }
}
