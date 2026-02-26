async (input) => {
  const res = await integration.fetch(`/cards/${encodeURIComponent(input.cardId)}`, { method: 'DELETE' })
  try {
    return await res.json()
  }
  catch {
    return ''
  }
}
