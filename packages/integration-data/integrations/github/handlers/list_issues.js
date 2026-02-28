async (input) => {
  const params = new URLSearchParams()
  if (input.state) params.set('state', input.state)
  if (input.labels) params.set('labels', input.labels)
  if (input.assignee) params.set('assignee', input.assignee)
  if (input.page) params.set('page', String(input.page))
  if (input.per_page) params.set('per_page', String(input.per_page))
  const query = params.toString() ? `?${params.toString()}` : ''
  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/issues${query}`)
  return await res.json()
}
