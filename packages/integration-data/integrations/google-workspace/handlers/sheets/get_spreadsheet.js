async (input) => {
  const { spreadsheetId, includeGridData, ranges } = input
  const params = new URLSearchParams()
  if (includeGridData !== undefined)
    params.set('includeGridData', String(includeGridData))
  if (Array.isArray(ranges))
    ranges.forEach(r => params.append('ranges', String(r)))
  if (input.fields)
    params.set('fields', input.fields)
  const qs = params.toString()
  const path = `/spreadsheets/${encodeURIComponent(spreadsheetId)}${qs ? `?${qs}` : ''}`
  const res = await integration.fetch(path)
  return await res.json()
}
