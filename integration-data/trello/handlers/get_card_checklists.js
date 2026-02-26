async (input) => {
  const res = await integration.fetch(`/cards/${input.cardId}/checklists`)
  return await res.json()
}
