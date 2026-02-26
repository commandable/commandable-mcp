async (input) => {
  const body = {
    filter: input.filter || undefined,
    sorts: input.sorts || undefined,
    start_cursor: input.start_cursor || undefined,
    page_size: input.page_size || undefined,
  }
  const res = await integration.fetch(`/databases/${encodeURIComponent(input.database_id)}/query`, { method: 'POST', body })
  return await res.json()
}
