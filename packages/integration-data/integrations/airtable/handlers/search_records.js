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
    const matchField = typeof input.field === 'string' ? input.field : null
    const matchValue = matchField ? summarizeValue(fields[matchField]) : null
    return {
      id: record?.id || null,
      createdTime: record?.createdTime || null,
      fieldCount: fieldNames.length,
      fieldNames,
      matchField,
      matchValue,
    }
  }

  const formula = `{${input.field}} = "${input.value}"`
  const params = new URLSearchParams({ filterByFormula: formula })
  const res = await integration.fetch(`/${input.baseId}/${input.tableId}?${params.toString()}`)
  const data = await res.json()
  const records = Array.isArray(data?.records) ? data.records.map(summarizeRecord) : []
  return {
    count: records.length,
    offset: data?.offset || null,
    note: 'Use record id with get_record for full field data.',
    records,
  }
}
