async (input) => {
  const res = await integration.fetch('/user')
  return await res.json()
}
