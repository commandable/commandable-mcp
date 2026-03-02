async (input) => {
  const params = new URLSearchParams()
  if (input?.query)
    params.set('query', input.query)
  params.set('startAt', String(input?.startAt ?? 0))
  params.set('maxResults', String(input?.maxResults ?? 50))

  const path = `/rest/api/3/project/search?${params.toString()}`
  const res = await integration.fetch(path)
  const data = await res.json()
  const values = Array.isArray(data.values) ? data.values : []

  return {
    startAt: data.startAt ?? (input?.startAt ?? 0),
    maxResults: data.maxResults ?? (input?.maxResults ?? 50),
    total: data.total ?? values.length,
    isLast: Boolean(data.isLast),
    projects: values.map(p => ({
      id: p.id ?? null,
      key: p.key ?? null,
      name: p.name ?? null,
      projectTypeKey: p.projectTypeKey ?? null,
      simplified: p.simplified ?? null,
      style: p.style ?? null,
      isPrivate: p.isPrivate ?? null,
    })),
  }
}

