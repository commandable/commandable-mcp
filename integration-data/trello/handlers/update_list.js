async (input) => {
  const params = new URLSearchParams()
  if (input.name !== undefined && input.name !== null)
    params.set('name', input.name)
  if (input.closed !== undefined && input.closed !== null)
    params.set('closed', String(input.closed))
  if (input.pos !== undefined && input.pos !== null)
    params.set('pos', String(input.pos))
  const res = await integration.fetch(`/lists/${encodeURIComponent(input.listId)}?${params.toString()}`, { method: 'PUT' })
  return await res.json()
}
