export default (integration) => async (input) => {
  const params = new URLSearchParams()
  if (input.jql)
    params.set('jql', input.jql)
  if (Array.isArray(input.fields) && input.fields.length)
    params.set('fields', input.fields.join(','))
  params.set('startAt', String(input.startAt ?? 0))
  params.set('maxResults', String(input.maxResults ?? 50))

  const res = await integration.fetch(`/rest/agile/1.0/sprint/${encodeURIComponent(String(input.sprintId))}/issue?${params.toString()}`)
  return await res.json()
}

