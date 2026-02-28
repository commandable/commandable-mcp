async (input) => {
  const userId = encodeURIComponent(input.userId || 'me')
  const labelId = encodeURIComponent(input.labelId)
  const res = await integration.fetch(`/users/${userId}/labels/${labelId}`)
  return await res.json()
}
