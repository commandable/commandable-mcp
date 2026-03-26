async (input) => {
  const params = new URLSearchParams()
  params.set('q', input.query)
  if (input.page) params.set('page', String(input.page))
  if (input.per_page) params.set('per_page', String(input.per_page))
  const res = await integration.fetch(`/search/issues?${params.toString()}`)
  const data = await res.json()
  const items = Array.isArray(data?.items)
    ? data.items
      .filter(item => !!item.pull_request)
      .map(pr => ({
        id: pr.id,
        number: pr.number,
        repositoryFullName: pr.repository_url ? pr.repository_url.replace('https://api.github.com/repos/', '') : null,
        title: pr.title ?? null,
        state: pr.state ?? null,
        author: pr.user?.login ?? null,
        commentCount: pr.comments ?? 0,
        createdAt: pr.created_at ?? null,
        updatedAt: pr.updated_at ?? null,
        htmlUrl: pr.html_url ?? null,
      }))
    : []
  return {
    totalCount: typeof data?.total_count === 'number' ? data.total_count : items.length,
    incompleteResults: !!data?.incomplete_results,
    count: items.length,
    note: 'Use owner/repo + pull number with get_pull_request for full details.',
    pullRequests: items,
  }
}
