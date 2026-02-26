async (input) => {
  const res = await integration.fetch(`/cards/${input.cardId}/attachments`)
  return await res.json()
}
