async (input) => {
  const res = await integration.fetch(`/lists/${input.listId}`)
  return await res.json()
}
