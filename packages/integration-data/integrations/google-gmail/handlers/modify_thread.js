async (input) => {
  const userId = encodeURIComponent(input.userId || 'me')
  const threadId = encodeURIComponent(input.threadId)
  const body = {}
  if (Array.isArray(input.addLabelIds))
    body.addLabelIds = input.addLabelIds
  if (Array.isArray(input.removeLabelIds))
    body.removeLabelIds = input.removeLabelIds
  const res = await integration.fetch(`/users/${userId}/threads/${threadId}/modify`, { method: 'POST', body })
  return await res.json()
}
