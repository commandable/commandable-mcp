async (input) => {
  const res = await integration.fetch(`/cards/${input.cardId}/actions`)
  return await res.json()
}
