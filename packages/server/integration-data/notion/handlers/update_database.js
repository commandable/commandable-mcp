async (input) => {
  const body = {
    title: input.title || undefined,
    description: input.description || undefined,
    properties: input.properties || undefined,
    archived: input.archived === undefined ? undefined : input.archived,
  }
  const res = await integration.fetch(`/databases/${encodeURIComponent(input.database_id)}`, { method: 'PATCH', body })
  return await res.json()
}
