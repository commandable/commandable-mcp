async (input) => {
  const { presentationId, pageObjectId } = input
  const params = new URLSearchParams()
  if (input['thumbnailProperties.thumbnailSize'])
    params.set('thumbnailProperties.thumbnailSize', String(input['thumbnailProperties.thumbnailSize']))
  if (input['thumbnailProperties.mimeType'])
    params.set('thumbnailProperties.mimeType', String(input['thumbnailProperties.mimeType']))
  const qs = params.toString()
  const path = `/presentations/${encodeURIComponent(presentationId)}/pages/${encodeURIComponent(pageObjectId)}/thumbnail${qs ? `?${qs}` : ''}`
  const res = await integration.fetch(path)
  return await res.json()
}
