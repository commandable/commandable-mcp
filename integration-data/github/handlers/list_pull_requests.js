async (input) => {
  const params = new URLSearchParams()
  if (input.state)
    params.set('state', input.state)
  const query = params.toString() ? `?${params.toString()}` : ''
  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/pulls${query}`)
  return await res.json()
}
