async (input) => {
  const params = new URLSearchParams({ value: input.memberId })
  const res = await integration.fetch(`/cards/${encodeURIComponent(input.cardId)}/idMembers?${params.toString()}`, { method: 'POST' })
  return await res.json()
}
