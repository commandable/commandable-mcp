async (input) => {
  const res = await integration.fetch(`/boards/${input.boardId}/customFields`)
  return await res.json()
}
