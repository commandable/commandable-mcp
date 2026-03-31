async (input) => {
  const params = new URLSearchParams()
  params.set('q', input.query)
  if (input.page) params.set('page', String(input.page))
  if (input.per_page) params.set('per_page', String(input.per_page))
  const res = await integration.fetch(`/search/issues?${params.toString()}`)
  const data = await res.json()
  const items = Array.isArray(data?.items)
    ? data.items.map(issue => ({
      id: issue.id,
      number: issue.number,
      repositoryFullName: issue.repository_url ? issue.repository_url.replace('https://api.github.com/repos/', '') : null,
      title: issue.title ?? null,
      state: issue.state ?? null,
      user: issue.user?.login ?? null,
      labels: Array.isArray(issue.labels) ? issue.labels.map(l => typeof l === 'string' ? l : l?.name).filter(Boolean) : [],
      comments: issue.comments ?? 0,
      createdAt: issue.created_at ?? null,
      updatedAt: issue.updated_at ?? null,
      htmlUrl: issue.html_url ?? null,
      isPullRequest: !!issue.pull_request,
    }))
    : []
  return {
    totalCount: typeof data?.total_count === 'number' ? data.total_count : items.length,
    incompleteResults: !!data?.incomplete_results,
    count: items.length,
    note: 'Use owner/repo + issue number with get_issue for full details.',
    issues: items,
  }
}
