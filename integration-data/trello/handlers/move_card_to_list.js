async (input) => {
  const params = new URLSearchParams({ value: input.listId })
  const res = await integration.fetch(`/cards/${encodeURIComponent(input.cardId)}/idList?${params.toString()}`, { method: 'PUT' })
  return await res.json()
}
