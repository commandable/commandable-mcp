async (input) => {
  const userId = encodeURIComponent(input.userId || 'me')
  const params = new URLSearchParams()
  if (input.q)
    params.set('q', input.q)
  if (Array.isArray(input.labelIds)) {
    for (const labelId of input.labelIds)
      params.append('labelIds', String(labelId))
  }
  if (input.maxResults !== undefined)
    params.set('maxResults', String(input.maxResults))
  if (input.pageToken)
    params.set('pageToken', input.pageToken)
  if (input.includeSpamTrash !== undefined)
    params.set('includeSpamTrash', String(input.includeSpamTrash))
  const qs = params.toString()
  const res = await integration.fetch(`/users/${userId}/threads${qs ? `?${qs}` : ''}`)
  return await res.json()
}
