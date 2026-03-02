export default (integration) => async (input) => {
  const params = new URLSearchParams()
  if (input?.projectKeyOrId)
    params.set('projectKeyOrId', input.projectKeyOrId)
  if (input?.type)
    params.set('type', input.type)
  params.set('startAt', String(input?.startAt ?? 0))
  params.set('maxResults', String(input?.maxResults ?? 50))

  const res = await integration.fetch(`/rest/agile/1.0/board?${params.toString()}`)
  const data = await res.json()
  const values = Array.isArray(data.values) ? data.values : []

  return {
    startAt: data.startAt ?? (input?.startAt ?? 0),
    maxResults: data.maxResults ?? (input?.maxResults ?? 50),
    total: data.total ?? values.length,
    isLast: Boolean(data.isLast),
    boards: values.map(b => ({
      id: b.id ?? null,
      name: b.name ?? null,
      type: b.type ?? null,
      location: b.location
        ? {
            projectId: b.location.projectId ?? null,
            projectKey: b.location.projectKey ?? null,
            projectName: b.location.projectName ?? null,
          }
        : null,
      self: b.self ?? null,
    })),
  }
}

