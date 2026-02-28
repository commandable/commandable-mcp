async (input) => {
  const params = new URLSearchParams()
  params.set('q', input.query)
  if (input.page) params.set('page', String(input.page))
  if (input.per_page) params.set('per_page', String(input.per_page))
  const res = await integration.fetch(`/search/code?${params.toString()}`)
  return await res.json()
}
