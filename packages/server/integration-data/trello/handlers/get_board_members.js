async (input) => {
  const res = await integration.fetch(`/boards/${input.boardId}/members`)
  return await res.json()
}
