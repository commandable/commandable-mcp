async (input) => {
  const res = await integration.fetch('/colors')
  return await res.json()
}
