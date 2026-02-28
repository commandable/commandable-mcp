async (input) => {
  const userId = encodeURIComponent(input.userId || 'me')
  const draftId = encodeURIComponent(input.draftId)
  const res = await integration.fetch(`/users/${userId}/drafts/${draftId}`, { method: 'DELETE' })
  if (res.status === 204)
    return { success: true }
  try {
    return await res.json()
  }
  catch {
    return { success: true }
  }
}
