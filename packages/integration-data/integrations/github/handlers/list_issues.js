async (input) => {
  const params = new URLSearchParams()
  if (input.state) params.set('state', input.state)
  if (input.labels) params.set('labels', input.labels)
  if (input.assignee) params.set('assignee', input.assignee)
  if (input.page) params.set('page', String(input.page))
  if (input.per_page) params.set('per_page', String(input.per_page))
  const query = params.toString() ? `?${params.toString()}` : ''
  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/issues${query}`)
  const data = await res.json()
  const issues = Array.isArray(data)
    ? data.map(issue => ({
      id: issue.id,
      number: issue.number,
      title: issue.title ?? null,
      state: issue.state ?? null,
      user: issue.user?.login ?? null,
      assignee: issue.assignee?.login ?? null,
      labels: Array.isArray(issue.labels) ? issue.labels.map(l => typeof l === 'string' ? l : l?.name).filter(Boolean) : [],
      comments: issue.comments ?? 0,
      createdAt: issue.created_at ?? null,
      updatedAt: issue.updated_at ?? null,
      htmlUrl: issue.html_url ?? null,
      isPullRequest: !!issue.pull_request,
    }))
    : []
  return {
    count: issues.length,
    note: 'Use issue number with get_issue for full issue details.',
    issues,
  }
}
