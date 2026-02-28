async (input) => {
  const userId = encodeURIComponent(input.userId || 'me')
  const draftId = encodeURIComponent(input.draftId)
  const res = await integration.fetch(`/users/${userId}/drafts/${draftId}`)
  return await res.json()
}
