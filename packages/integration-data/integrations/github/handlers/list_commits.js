async (input) => {
  const params = new URLSearchParams()
  if (input.sha) params.set('sha', input.sha)
  if (typeof input.path === 'string' && input.path.length > 0) params.set('path', input.path)
  if (input.author) params.set('author', input.author)
  if (input.page) params.set('page', String(input.page))
  if (input.per_page) params.set('per_page', String(input.per_page))
  const query = params.toString() ? `?${params.toString()}` : ''
  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/commits${query}`)
  return await res.json()
}
