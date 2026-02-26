async (input) => {
  const path = `/${input.baseId}/${input.tableId}`
  const params = new URLSearchParams()
  params.set('records[]', input.recordId)
  const res = await integration.fetch(`${path}?${params.toString()}`, { method: 'DELETE' })
  return await res.json()
}
