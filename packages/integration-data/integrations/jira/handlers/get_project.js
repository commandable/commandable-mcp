export default (integration) => async (input) => {
  const params = new URLSearchParams()
  if (input.expandIssueTypes !== false)
    params.set('expand', 'issueTypes')

  const path = `/rest/api/3/project/${encodeURIComponent(input.projectIdOrKey)}${params.toString() ? `?${params.toString()}` : ''}`
  const res = await integration.fetch(path)
  const data = await res.json()

  const issueTypes = Array.isArray(data.issueTypes) ? data.issueTypes : []

  return {
    id: data.id ?? null,
    key: data.key ?? null,
    name: data.name ?? null,
    projectTypeKey: data.projectTypeKey ?? null,
    simplified: data.simplified ?? null,
    style: data.style ?? null,
    isPrivate: data.isPrivate ?? null,
    issueTypes: issueTypes.map(t => ({
      id: t.id ?? null,
      name: t.name ?? null,
      description: t.description ?? null,
      subtask: t.subtask ?? null,
    })),
  }
}

