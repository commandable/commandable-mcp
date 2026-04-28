async (input) => {
  const { spreadsheetId, ranges } = input
  const path = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values:batchClear`
  const res = await integration.fetch(path, { method: 'POST', body: { ranges } })
  return await res.json()
}
