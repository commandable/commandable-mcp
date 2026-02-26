async (input) => {
  const res = await integration.fetch(`/users/me`)
  return await res.json()
}
