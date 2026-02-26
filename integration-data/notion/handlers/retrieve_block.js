async (input) => {
  const res = await integration.fetch(`/blocks/${encodeURIComponent(input.block_id)}`)
  return await res.json()
}
