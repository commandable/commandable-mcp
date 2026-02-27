async (input) => {
  const res = await integration.fetch(`/blocks/${encodeURIComponent(input.block_id)}/children`, {
    method: 'PATCH',
    body: { children: input.children },
  })
  return await res.json()
}
