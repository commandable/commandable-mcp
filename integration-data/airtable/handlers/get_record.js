async (input) => {
  const res = await integration.fetch(`/${input.baseId}/${input.tableId}/${input.recordId}`)
  return await res.json()
}
