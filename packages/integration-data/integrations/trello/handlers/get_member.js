async (input) => {
  const res = await integration.fetch(`/members/me`)
  return await res.json()
}
