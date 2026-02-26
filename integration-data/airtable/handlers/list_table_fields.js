async (input) => {
  const res = await integration.fetch(`/meta/bases/${input.baseId}/tables`)
  const data = await res.json()
  const table = (data?.tables || data)?.find?.(t => t.id === input.tableId || t.name === input.tableId)
  return table?.fields || []
}
