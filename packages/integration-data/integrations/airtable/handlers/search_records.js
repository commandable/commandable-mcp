async (input) => {
  const formula = `{${input.field}} = "${input.value}"`
  const params = new URLSearchParams({ filterByFormula: formula })
  const res = await integration.fetch(`/${input.baseId}/${input.tableId}?${params.toString()}`)
  return await res.json()
}
