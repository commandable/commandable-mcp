async (input) => {
  const res = await integration.fetch(`/boards/${encodeURIComponent(input.boardId)}`, { method: 'DELETE' })
  if (res.status === 204)
    return { success: true, status: 204 }
  // Trello sometimes returns JSON on delete failures.
  try {
    return await res.json()
  }
  catch {
    return { success: res.ok, status: res.status }
  }
}

