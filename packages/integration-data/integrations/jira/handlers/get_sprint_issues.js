async (input) => {
  const params = new URLSearchParams()
  if (input.jql)
    params.set('jql', input.jql)
  if (Array.isArray(input.fields) && input.fields.length)
    params.set('fields', input.fields.join(','))
  params.set('startAt', String(input.startAt ?? 0))
  params.set('maxResults', String(input.maxResults ?? 50))

  const res = await integration.fetch(`/rest/agile/1.0/sprint/${encodeURIComponent(String(input.sprintId))}/issue?${params.toString()}`)
  const data = await res.json()
  const issues = Array.isArray(data?.issues)
    ? data.issues.map(i => ({
      id: i.id ?? null,
      key: i.key ?? null,
      summary: i.fields?.summary ?? null,
      status: i.fields?.status?.name ?? null,
      assignee: i.fields?.assignee
        ? {
            accountId: i.fields.assignee.accountId ?? null,
            displayName: i.fields.assignee.displayName ?? null,
          }
        : null,
      priority: i.fields?.priority?.name ?? null,
      issueType: i.fields?.issuetype?.name ?? null,
      updated: i.fields?.updated ?? null,
    }))
    : []
  return {
    startAt: data?.startAt ?? 0,
    maxResults: data?.maxResults ?? issues.length,
    total: data?.total ?? issues.length,
    count: issues.length,
    note: 'Use issue key or id with get_issue for full issue details.',
    issues,
  }
}

