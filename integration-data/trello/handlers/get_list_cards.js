async (input) => {
  const res = await integration.fetch(`/lists/${input.listId}/cards`)
  return await res.json()
}
