async (input) => {
  const params = new URLSearchParams()
  if (input.branch) params.set('branch', input.branch)
  if (input.status) params.set('status', input.status)
  if (input.event) params.set('event', input.event)
  if (input.page) params.set('page', String(input.page))
  if (input.per_page) params.set('per_page', String(input.per_page))
  const query = params.toString() ? `?${params.toString()}` : ''
  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/actions/runs${query}`)
  return await res.json()
}
