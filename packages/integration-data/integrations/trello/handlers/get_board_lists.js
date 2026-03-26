async (input) => {
  const fields = ['id', 'name', 'idBoard', 'closed', 'pos', 'softLimit'].join(',')
  const res = await integration.fetch(`/boards/${input.boardId}/lists?fields=${encodeURIComponent(fields)}`)
  const raw = await res.json()
  const lists = Array.isArray(raw)
    ? raw.map(list => ({
      id: list.id,
      name: list.name,
      idBoard: list.idBoard || null,
      closed: !!list.closed,
      position: list.pos ?? null,
      softLimit: typeof list.softLimit === 'number' ? list.softLimit : null,
    }))
    : []
  return {
    boardId: input.boardId,
    count: lists.length,
    note: 'Use list id with get_list for full list details.',
    lists,
  }
}
