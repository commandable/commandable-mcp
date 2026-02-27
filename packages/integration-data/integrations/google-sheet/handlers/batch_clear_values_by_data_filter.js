async (input) => {
  const { spreadsheetId, dataFilters } = input
  const path = `/spreadsheets/${encodeURIComponent(spreadsheetId)}/values:batchClearByDataFilter`
  const res = await integration.fetch(path, { method: 'POST', body: { dataFilters } })
  return await res.json()
}
