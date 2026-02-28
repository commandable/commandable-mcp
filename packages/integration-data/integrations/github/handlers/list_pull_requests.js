async (input) => {
  const params = new URLSearchParams()
  if (input.state) params.set('state', input.state)
  if (input.head) params.set('head', input.head)
  if (input.base) params.set('base', input.base)
  if (input.sort) params.set('sort', input.sort)
  if (input.direction) params.set('direction', input.direction)
  if (input.page) params.set('page', String(input.page))
  if (input.per_page) params.set('per_page', String(input.per_page))
  const query = params.toString() ? `?${params.toString()}` : ''
  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/pulls${query}`)
  return await res.json()
}
