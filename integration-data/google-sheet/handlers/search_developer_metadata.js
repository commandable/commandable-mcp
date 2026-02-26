async (input) => {
  const { spreadsheetId, dataFilters } = input
  // Correct endpoint per Sheets API: /spreadsheets/{spreadsheetId}/developerMetadata:search
  const path = `/spreadsheets/${encodeURIComponent(spreadsheetId)}/developerMetadata:search`
  const res = await integration.fetch(path, { method: 'POST', body: { dataFilters } })
  return await res.json()
}
