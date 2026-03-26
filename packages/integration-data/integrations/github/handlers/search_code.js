async (input) => {
  const params = new URLSearchParams()
  params.set('q', input.query)
  if (input.page) params.set('page', String(input.page))
  if (input.per_page) params.set('per_page', String(input.per_page))
  const res = await integration.fetch(`/search/code?${params.toString()}`)
  const data = await res.json()
  const items = Array.isArray(data?.items)
    ? data.items.map(item => ({
      sha: item.sha ?? null,
      name: item.name ?? null,
      path: item.path ?? null,
      repositoryFullName: item.repository?.full_name ?? null,
      url: item.html_url ?? null,
    }))
    : []
  return {
    totalCount: typeof data?.total_count === 'number' ? data.total_count : items.length,
    incompleteResults: !!data?.incomplete_results,
    count: items.length,
    note: 'Use owner/repo + path (and optional ref) with get_file_contents for full file content.',
    matches: items,
  }
}
