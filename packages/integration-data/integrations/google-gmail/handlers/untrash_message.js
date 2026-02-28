async (input) => {
  const userId = encodeURIComponent(input.userId || 'me')
  const messageId = encodeURIComponent(input.messageId)
  const res = await integration.fetch(`/users/${userId}/messages/${messageId}/untrash`, { method: 'POST' })
  return await res.json()
}
