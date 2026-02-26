async (input) => {
  const params = new URLSearchParams({ query: input.query })
  const res = await integration.fetch(`/search?${params.toString()}`)
  return await res.json()
}
