async (input) => {
  const res = await integration.fetch(`/boards/${input.boardId}/lists`)
  return await res.json()
}
