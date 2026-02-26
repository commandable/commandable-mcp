async (input) => {
  const body = {
    properties: input.properties,
    archived: input.archived === undefined ? undefined : input.archived,
    icon: input.icon || undefined,
    cover: input.cover || undefined,
  }
  const res = await integration.fetch(`/pages/${encodeURIComponent(input.page_id)}`, { method: 'PATCH', body })
  return await res.json()
}
