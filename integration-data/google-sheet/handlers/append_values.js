async (input) => {
  const { spreadsheetId, range, values, valueInputOption, insertDataOption, includeValuesInResponse, responseValueRenderOption, responseDateTimeRenderOption } = input
  const params = new URLSearchParams()
  if (valueInputOption)
    params.set('valueInputOption', valueInputOption)
  if (insertDataOption)
    params.set('insertDataOption', insertDataOption)
  if (includeValuesInResponse !== undefined)
    params.set('includeValuesInResponse', String(includeValuesInResponse))
  if (responseValueRenderOption)
    params.set('responseValueRenderOption', responseValueRenderOption)
  if (responseDateTimeRenderOption)
    params.set('responseDateTimeRenderOption', responseDateTimeRenderOption)
  const qs = params.toString()
  const path = `/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}:append${qs ? `?${qs}` : ''}`
  const res = await integration.fetch(path, { method: 'POST', body: { values } })
  return await res.json()
}
