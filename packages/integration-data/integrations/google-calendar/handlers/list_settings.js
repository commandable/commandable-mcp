async (input) => {
  const res = await integration.fetch('/users/me/settings')
  return await res.json()
}
