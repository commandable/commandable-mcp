async (input) => {
  const { spreadsheetId, ranges, majorDimension, valueRenderOption, dateTimeRenderOption } = input
  const params = new URLSearchParams()
  if (Array.isArray(ranges))
    ranges.forEach(r => params.append('ranges', String(r)))
  if (majorDimension)
    params.set('majorDimension', majorDimension)
  if (valueRenderOption)
    params.set('valueRenderOption', valueRenderOption)
  if (dateTimeRenderOption)
    params.set('dateTimeRenderOption', dateTimeRenderOption)
  const qs = params.toString()
  const path = `/spreadsheets/${encodeURIComponent(spreadsheetId)}/values:batchGet${qs ? `?${qs}` : ''}`
  const res = await integration.fetch(path)
  return await res.json()
}
