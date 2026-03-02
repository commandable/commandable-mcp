export default (integration) => async (input) => {
  const params = new URLSearchParams()
  if (Array.isArray(input.state) && input.state.length)
    params.set('state', input.state.join(','))
  params.set('startAt', String(input.startAt ?? 0))
  params.set('maxResults', String(input.maxResults ?? 50))

  const res = await integration.fetch(`/rest/agile/1.0/board/${encodeURIComponent(String(input.boardId))}/sprint?${params.toString()}`)
  const data = await res.json()
  const values = Array.isArray(data.values) ? data.values : []

  return {
    startAt: data.startAt ?? (input.startAt ?? 0),
    maxResults: data.maxResults ?? (input.maxResults ?? 50),
    total: data.total ?? values.length,
    isLast: Boolean(data.isLast),
    sprints: values.map(s => ({
      id: s.id ?? null,
      name: s.name ?? null,
      state: s.state ?? null,
      goal: s.goal ?? null,
      startDate: s.startDate ?? null,
      endDate: s.endDate ?? null,
      completeDate: s.completeDate ?? null,
      self: s.self ?? null,
    })),
  }
}

