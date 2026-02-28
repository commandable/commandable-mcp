async (input) => {
  const userId = encodeURIComponent(input.userId || 'me')
  const threadId = encodeURIComponent(input.threadId)
  const res = await integration.fetch(`/users/${userId}/threads/${threadId}`, { method: 'DELETE' })
  if (res.status === 204)
    return { success: true }
  try {
    return await res.json()
  }
  catch {
    return { success: true }
  }
}
