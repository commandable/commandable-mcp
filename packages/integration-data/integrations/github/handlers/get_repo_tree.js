async (input) => {
  const ref = input.ref || 'HEAD'
  const params = new URLSearchParams()
  if (input.recursive !== false) params.set('recursive', '1')
  const query = params.toString() ? `?${params.toString()}` : ''
  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/git/trees/${ref}${query}`)
  const data = await res.json()
  if (input.path_filter && Array.isArray(data.tree)) {
    data.tree = data.tree.filter((item) => item.path && item.path.startsWith(input.path_filter))
  }
  return data
}
