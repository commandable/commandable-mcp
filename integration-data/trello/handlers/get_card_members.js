async (input) => {
  const res = await integration.fetch(`/cards/${input.cardId}/members`)
  return await res.json()
}
