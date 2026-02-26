async (input) => {
  const { spreadsheetId, requests, includeSpreadsheetInResponse, responseRanges, responseIncludeGridData } = input
  const params = new URLSearchParams()
  if (includeSpreadsheetInResponse !== undefined)
    params.set('includeSpreadsheetInResponse', String(includeSpreadsheetInResponse))
  if (Array.isArray(responseRanges))
    responseRanges.forEach(r => params.append('responseRanges', String(r)))
  if (responseIncludeGridData !== undefined)
    params.set('responseIncludeGridData', String(responseIncludeGridData))
  const qs = params.toString()
  const path = `/spreadsheets/${encodeURIComponent(spreadsheetId)}:batchUpdate${qs ? `?${qs}` : ''}`
  const res = await integration.fetch(path, { method: 'POST', body: { requests } })
  return await res.json()
}
