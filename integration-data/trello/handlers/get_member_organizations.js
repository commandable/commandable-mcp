async (input) => {
  const res = await integration.fetch(`/members/me/organizations`)
  return await res.json()
}
