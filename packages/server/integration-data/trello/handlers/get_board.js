async (input) => {
  const res = await integration.fetch(`/boards/${input.boardId}`)
  return await res.json()
}
