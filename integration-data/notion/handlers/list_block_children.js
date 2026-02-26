async (input) => {
  const params = new URLSearchParams()
  if (input.start_cursor)
    params.set('start_cursor', input.start_cursor)
  if (input.page_size)
    params.set('page_size', String(input.page_size))
  const qs = params.toString()
  const res = await integration.fetch(`/blocks/${encodeURIComponent(input.block_id)}/children${qs ? `?${qs}` : ''}`)
  return await res.json()
}
