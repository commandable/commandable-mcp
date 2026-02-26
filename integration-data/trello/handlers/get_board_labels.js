async (input) => {
  const res = await integration.fetch(`/boards/${input.boardId}/labels`)
  return await res.json()
}
