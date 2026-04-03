async (input) => {
  const { presentationId, findText, shapeType = 'RECTANGLE', width = 2000000, height = 1000000 } = input
  const presRes = await integration.fetch(`/presentations/${encodeURIComponent(presentationId)}`)
  const pres = await presRes.json()
  // Find slide with first text match
  let targetSlideId = null
  for (const slide of (pres?.slides || [])) {
    const text = JSON.stringify(slide)
    if (text && text.includes(findText)) { targetSlideId = slide.objectId; break }
  }
  if (!targetSlideId)
    return { presentationId, applied: false, replies: [] }
  // Insert a shape at a default position near center
  const elementId = `shape_${Date.now()}`
  const requests = [
    { createShape: { objectId: elementId, shapeType, elementProperties: { pageObjectId: targetSlideId, size: { width: { magnitude: width, unit: 'EMU' }, height: { magnitude: height, unit: 'EMU' } }, transform: { scaleX: 1, scaleY: 1, translateX: 1000000, translateY: 1000000, unit: 'EMU' } } } },
  ]
  const res = await integration.fetch(`/presentations/${encodeURIComponent(presentationId)}:batchUpdate`, { method: 'POST', body: { requests } })
  const out = await res.json()
  return out?.presentationId ? { ...out, applied: true } : { presentationId, applied: true, replies: out?.replies || [] }
}
