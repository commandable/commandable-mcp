async (input) => {
  const params = new URLSearchParams({ closed: 'true' })
  const res = await integration.fetch(`/boards/${encodeURIComponent(input.boardId)}?${params.toString()}`, { method: 'PUT' })
  return await res.json()
}

