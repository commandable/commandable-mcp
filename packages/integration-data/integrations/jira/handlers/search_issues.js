export default (integration) => async (input) => {
  const body = {
    jql: input.jql,
    maxResults: input.maxResults ?? 50,
  }

  if (Array.isArray(input.fields) && input.fields.length)
    body.fields = input.fields
  if (input.nextPageToken)
    body.nextPageToken = input.nextPageToken

  const res = await integration.fetch('/rest/api/3/search/jql', {
    method: 'POST',
    body,
  })

  const data = await res.json()
  const issues = Array.isArray(data.issues) ? data.issues : []

  return {
    isLast: Boolean(data.isLast),
    nextPageToken: data.nextPageToken ?? null,
    issues: issues.map((i) => ({
      id: i.id,
      key: i.key,
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
      project: i.fields?.project
        ? { key: i.fields.project.key ?? null, name: i.fields.project.name ?? null }
        : null,
      updated: i.fields?.updated ?? null,
    })),
  }
}

