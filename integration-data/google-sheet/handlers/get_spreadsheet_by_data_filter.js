async (input) => {
  const { spreadsheetId, dataFilters, includeGridData } = input
  const params = new URLSearchParams()
  if (includeGridData !== undefined)
    params.set('includeGridData', String(includeGridData))
  const qs = params.toString()
  const path = `/spreadsheets/${encodeURIComponent(spreadsheetId)}:getByDataFilter${qs ? `?${qs}` : ''}`
  const res = await integration.fetch(path, { method: 'POST', body: { dataFilters } })
  return await res.json()
}
