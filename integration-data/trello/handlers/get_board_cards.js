async (input) => {
  const res = await integration.fetch(`/boards/${input.boardId}/cards`)
  return await res.json()
}
