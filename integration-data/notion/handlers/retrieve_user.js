async (input) => {
  const res = await integration.fetch(`/users/${encodeURIComponent(input.user_id)}`)
  return await res.json()
}
