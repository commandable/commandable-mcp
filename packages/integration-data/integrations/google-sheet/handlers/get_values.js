async (input) => {
  const { spreadsheetId, range, majorDimension, valueRenderOption, dateTimeRenderOption } = input
  const params = new URLSearchParams()
  if (majorDimension)
    params.set('majorDimension', majorDimension)
  if (valueRenderOption)
    params.set('valueRenderOption', valueRenderOption)
  if (dateTimeRenderOption)
    params.set('dateTimeRenderOption', dateTimeRenderOption)
  const qs = params.toString()
  const path = `/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}${qs ? `?${qs}` : ''}`
  const res = await integration.fetch(path)
  return await res.json()
}
