async (input) => {
  const params = new URLSearchParams({ value: 'true' })
  const res = await integration.fetch(`/lists/${encodeURIComponent(input.listId)}/closed?${params.toString()}`, { method: 'PUT' })
  return await res.json()
}
