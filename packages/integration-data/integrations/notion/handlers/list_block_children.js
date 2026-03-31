async (input) => {
  const params = new URLSearchParams()
  if (input.start_cursor)
    params.set('start_cursor', input.start_cursor)
  if (input.page_size)
    params.set('page_size', String(input.page_size))
  const qs = params.toString()
  const res = await integration.fetch(`/blocks/${encodeURIComponent(input.block_id)}/children${qs ? `?${qs}` : ''}`)
  const data = await res.json()
  const blocks = Array.isArray(data?.results)
    ? data.results.map(block => ({
      id: block?.id ?? null,
      type: block?.type ?? null,
      hasChildren: !!block?.has_children,
      archived: !!block?.archived,
      createdTime: block?.created_time ?? null,
      lastEditedTime: block?.last_edited_time ?? null,
    }))
    : []
  return {
    block_id: input.block_id,
    count: blocks.length,
    has_more: !!data?.has_more,
    next_cursor: data?.next_cursor ?? null,
    note: 'Use id with retrieve_block for full block details.',
    blocks,
  }
}
