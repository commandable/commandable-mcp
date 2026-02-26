async (input) => {
  const body = {
    query: input.query || '',
    filter: input.filter || undefined,
    sort: input.sort || undefined,
    start_cursor: input.start_cursor || undefined,
    page_size: input.page_size || undefined,
  }
  const res = await integration.fetch(`/search`, { method: 'POST', body })
  return await res.json()
}
