async (input) => {
  const ref = input.ref || 'HEAD'
  const params = new URLSearchParams()
  if (input.recursive !== false) params.set('recursive', '1')
  const query = params.toString() ? `?${params.toString()}` : ''
  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/git/trees/${ref}${query}`)
  const data = await res.json()
  let tree = Array.isArray(data?.tree) ? data.tree : []
  if (input.path_filter)
    tree = tree.filter(item => item.path && item.path.startsWith(input.path_filter))

  const limit = 500
  const sliced = tree.slice(0, limit).map(item => ({
    path: item.path ?? null,
    type: item.type ?? null,
    mode: item.mode ?? null,
    sha: item.sha ?? null,
    size: item.size ?? null,
    url: item.url ?? null,
  }))

  return {
    sha: data?.sha ?? null,
    truncatedByGitHub: !!data?.truncated,
    count: tree.length,
    returnedCount: sliced.length,
    hasMore: tree.length > sliced.length,
    note: 'Use path + ref with get_file_contents for file content. Results are capped to 500 entries.',
    tree: sliced,
  }
}
