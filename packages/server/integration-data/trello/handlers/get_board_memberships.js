async (input) => {
  const res = await integration.fetch(`/boards/${input.boardId}/memberships`)
  return await res.json()
}
