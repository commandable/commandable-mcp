async (input) => {
  const res = await integration.fetch(`/members/me/boards`)
  return await res.json()
}
