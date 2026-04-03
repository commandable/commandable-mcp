async (input) => {
  const { presentationId, requests, includePresentationInResponse, responsePageObjectIds, writeControl } = input
  const params = new URLSearchParams()
  if (includePresentationInResponse !== undefined)
    params.set('includePresentationInResponse', String(includePresentationInResponse))
  if (Array.isArray(responsePageObjectIds))
    responsePageObjectIds.forEach(id => params.append('responsePageObjectIds', String(id)))
  const qs = params.toString()
  const path = `/presentations/${encodeURIComponent(presentationId)}:batchUpdate${qs ? `?${qs}` : ''}`
  const body = { requests }
  if (writeControl)
    body.writeControl = writeControl
  const res = await integration.fetch(path, { method: 'POST', body })
  return await res.json()
}
