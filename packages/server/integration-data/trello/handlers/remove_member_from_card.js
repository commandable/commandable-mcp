async (input) => {
  const res = await integration.fetch(`/cards/${encodeURIComponent(input.cardId)}/idMembers/${encodeURIComponent(input.memberId)}`, { method: 'DELETE' })
  try {
    return await res.json()
  }
  catch {
    return ''
  }
}
