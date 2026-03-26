async (input) => {
  const summarizeValue = (value) => {
    if (value === null || value === undefined)
      return null
    if (typeof value === 'string')
      return value.length <= 120 ? value : `${value.slice(0, 117)}...`
    if (typeof value === 'number' || typeof value === 'boolean')
      return value
    if (Array.isArray(value))
      return `[array:${value.length}]`
    if (typeof value === 'object')
      return '[object]'
    return String(value)
  }

  const summarizeRecord = (record) => {
    const fields = record && typeof record === 'object' && record.fields && typeof record.fields === 'object'
      ? record.fields
      : {}
    const fieldNames = Object.keys(fields)
    const firstFieldName = fieldNames[0] || null
    const firstFieldValue = firstFieldName ? summarizeValue(fields[firstFieldName]) : null
    return {
      id: record?.id || null,
      createdTime: record?.createdTime || null,
      fieldCount: fieldNames.length,
      fieldNames,
      primaryFieldName: firstFieldName,
      primaryFieldValue: firstFieldValue,
    }
  }

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
  const data = await res.json()
  const records = Array.isArray(data?.records) ? data.records.map(summarizeRecord) : []
  return {
    count: records.length,
    offset: data?.offset || null,
    note: 'Use record id with get_record for full field data.',
    records,
  }
}
