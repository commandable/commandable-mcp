async (input) => {
  const params = new URLSearchParams()
  params.set('q', input.query)
  if (input.sort) params.set('sort', input.sort)
  if (input.order) params.set('order', input.order)
  if (input.page) params.set('page', String(input.page))
  if (input.per_page) params.set('per_page', String(input.per_page))
  const res = await integration.fetch(`/search/repositories?${params.toString()}`)
  const data = await res.json()
  const items = Array.isArray(data?.items)
    ? data.items.map(item => ({
      id: item.id,
      fullName: item.full_name,
      owner: item.owner?.login ?? null,
      name: item.name ?? null,
      private: !!item.private,
      description: item.description ?? null,
      language: item.language ?? null,
      stargazersCount: item.stargazers_count ?? 0,
      forksCount: item.forks_count ?? 0,
      openIssuesCount: item.open_issues_count ?? 0,
      defaultBranch: item.default_branch ?? null,
      updatedAt: item.updated_at ?? null,
      htmlUrl: item.html_url ?? null,
    }))
    : []
  return {
    totalCount: typeof data?.total_count === 'number' ? data.total_count : items.length,
    incompleteResults: !!data?.incomplete_results,
    count: items.length,
    note: 'Use owner + repo (from fullName) with get_repo for full repository details.',
    repositories: items,
  }
}
