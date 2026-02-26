async (input) => {
  const res = await integration.fetch(`/cards/${input.cardId}/customFieldItems`)
  return await res.json()
}
