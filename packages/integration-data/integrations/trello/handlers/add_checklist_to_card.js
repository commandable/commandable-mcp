async (input) => {
  const params = new URLSearchParams({ idCard: input.cardId, name: input.name })
  const res = await integration.fetch(`/checklists?${params.toString()}`, { method: 'POST' })
  return await res.json()
}
