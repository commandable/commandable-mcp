async (input) => {
  const res = await integration.fetch(`/meta/bases/${input.baseId}/tables`)
  return await res.json()
}
