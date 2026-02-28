async (input) => {
  const userId = encodeURIComponent(input.userId || 'me')
  const threadId = encodeURIComponent(input.threadId)
  const params = new URLSearchParams()
  if (input.format)
    params.set('format', input.format)
  if (Array.isArray(input.metadataHeaders)) {
    for (const header of input.metadataHeaders)
      params.append('metadataHeaders', String(header))
  }
  const qs = params.toString()
  const res = await integration.fetch(`/users/${userId}/threads/${threadId}${qs ? `?${qs}` : ''}`)
  return await res.json()
}
