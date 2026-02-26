async (input) => {
  const params = new URLSearchParams()
  if (input.view)
    params.set('view', input.view)
  if (input.maxRecords)
    params.set('maxRecords', String(input.maxRecords))
  if (input.pageSize)
    params.set('pageSize', String(input.pageSize))
  if (input.filterByFormula)
    params.set('filterByFormula', input.filterByFormula)
  if (input.sort && Array.isArray(input.sort)) {
    input.sort.forEach((s, i) => {
      if (s && typeof s === 'object') {
        if (s.field)
          params.set(`sort[${i}][field]`, String(s.field))
        if (s.direction)
          params.set(`sort[${i}][direction]`, String(s.direction))
      }
    })
  }
  const qs = params.toString()
  const path = `/${input.baseId}/${input.tableId}${qs ? `?${qs}` : ''}`
  const res = await integration.fetch(path)
  return await res.json()
}
