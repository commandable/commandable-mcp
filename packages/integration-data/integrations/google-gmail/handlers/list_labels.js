async (input) => {
  const userId = encodeURIComponent(input.userId || 'me')
  const res = await integration.fetch(`/users/${userId}/labels`)
  return await res.json()
}
