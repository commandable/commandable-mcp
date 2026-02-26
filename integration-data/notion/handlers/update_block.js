async (input) => {
  const res = await integration.fetch(`/blocks/${encodeURIComponent(input.block_id)}`, {
    method: 'PATCH',
    body: input.body || {},
  })
  return await res.json()
}
