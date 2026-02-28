async (input) => {
  const userId = encodeURIComponent(input.userId || 'me')
  const messageId = encodeURIComponent(input.messageId)
  const res = await integration.fetch(`/users/${userId}/messages/${messageId}`, { method: 'DELETE' })
  if (res.status === 204)
    return { success: true }
  try {
    return await res.json()
  }
  catch {
    return { success: true }
  }
}
