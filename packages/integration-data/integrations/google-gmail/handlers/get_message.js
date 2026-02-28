async (input) => {
  const userId = encodeURIComponent(input.userId || 'me')
  const messageId = encodeURIComponent(input.messageId)
  const params = new URLSearchParams()
  if (input.format)
    params.set('format', input.format)
  if (Array.isArray(input.metadataHeaders)) {
    for (const header of input.metadataHeaders)
      params.append('metadataHeaders', String(header))
  }
  const qs = params.toString()
  const res = await integration.fetch(`/users/${userId}/messages/${messageId}${qs ? `?${qs}` : ''}`)
  return await res.json()
}
