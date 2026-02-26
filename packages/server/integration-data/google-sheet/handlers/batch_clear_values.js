async (input) => {
  const { spreadsheetId, ranges } = input
  const path = `/spreadsheets/${encodeURIComponent(spreadsheetId)}/values:batchClear`
  const res = await integration.fetch(path, { method: 'POST', body: { ranges } })
  return await res.json()
}
