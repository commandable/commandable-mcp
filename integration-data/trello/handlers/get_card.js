async (input) => {
  const res = await integration.fetch(`/cards/${input.cardId}`)
  return await res.json()
}
