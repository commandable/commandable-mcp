async (input) => {
  const { spreadsheetId, range } = input
  const path = `/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}:clear`
  const res = await integration.fetch(path, { method: 'POST', body: {} })
  return await res.json()
}
