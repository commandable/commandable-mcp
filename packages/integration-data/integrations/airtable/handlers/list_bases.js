async (input) => {
  const res = await integration.fetch(`/meta/bases`)
  return await res.json()
}
