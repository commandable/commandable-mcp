async (input) => {
  const userId = encodeURIComponent(input.userId || 'me')
  const messageId = encodeURIComponent(input.messageId)
  const body = {}
  if (Array.isArray(input.addLabelIds))
    body.addLabelIds = input.addLabelIds
  if (Array.isArray(input.removeLabelIds))
    body.removeLabelIds = input.removeLabelIds
  const res = await integration.fetch(`/users/${userId}/messages/${messageId}/modify`, { method: 'POST', body })
  return await res.json()
}
