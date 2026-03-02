async (input) => {
  const res = await integration.fetch(`/rest/agile/1.0/board/${encodeURIComponent(String(input.boardId))}`)
  const data = await res.json()
  return data
}

