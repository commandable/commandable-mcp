async (input) => {
  const userId = encodeURIComponent(input.userId || 'me')
  const threadId = encodeURIComponent(input.threadId)
  const res = await integration.fetch(`/users/${userId}/threads/${threadId}/trash`, { method: 'POST' })
  return await res.json()
}
