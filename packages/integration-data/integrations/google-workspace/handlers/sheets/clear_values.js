async (input) => {
  const { spreadsheetId, range } = input
  const path = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}:clear`
  const res = await integration.fetch(path, { method: 'POST', body: {} })
  return await res.json()
}
