async (input) => {
  const { spreadsheetId, sheetId, destinationSpreadsheetId } = input
  const path = `/spreadsheets/${encodeURIComponent(spreadsheetId)}/sheets/${encodeURIComponent(sheetId)}:copyTo`
  const res = await integration.fetch(path, { method: 'POST', body: { destinationSpreadsheetId } })
  return await res.json()
}
