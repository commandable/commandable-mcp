async (input) => {
  const params = new URLSearchParams()
  if (input.state)
    params.set('state', input.state)
  if (input.labels)
    params.set('labels', input.labels)
  if (input.assignee)
    params.set('assignee', input.assignee)
  const query = params.toString() ? `?${params.toString()}` : ''
  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/issues${query}`)
  return await res.json()
}
