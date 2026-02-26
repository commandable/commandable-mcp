async (input) => {
  const { documentId, requests, writeControl, includeTabStops } = input
  const params = new URLSearchParams()
  if (includeTabStops !== undefined)
    params.set('includeTabStops', String(includeTabStops))
  const qs = params.toString()
  const path = `/documents/${encodeURIComponent(documentId)}:batchUpdate${qs ? `?${qs}` : ''}`
  const body = { requests }
  if (writeControl)
    body.writeControl = writeControl
  const res = await integration.fetch(path, { method: 'POST', body })
  return await res.json()
}
