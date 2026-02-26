async (input) => {
  const params = new URLSearchParams()
  if (input.block_id)
    params.set('block_id', input.block_id)
  if (input.discussion_id)
    params.set('discussion_id', input.discussion_id)
  if (input.start_cursor)
    params.set('start_cursor', input.start_cursor)
  if (input.page_size)
    params.set('page_size', String(input.page_size))
  const qs = params.toString()
  const res = await integration.fetch(`/comments${qs ? `?${qs}` : ''}`)
  return await res.json()
}
