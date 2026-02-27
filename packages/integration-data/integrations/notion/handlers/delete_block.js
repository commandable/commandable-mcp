async (input) => {
  // Notion 'delete' is archive block
  const res = await integration.fetch(`/blocks/${encodeURIComponent(input.block_id)}`, {
    method: 'PATCH',
    body: { archived: true },
  })
  return await res.json()
}
