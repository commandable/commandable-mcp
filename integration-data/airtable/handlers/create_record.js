async (input) => {
  const path = `/${input.baseId}/${input.tableId}`
  const body = {
    records: [
      { fields: input.fields },
    ],
    typecast: !!input.typecast,
  }
  const res = await integration.fetch(path, { method: 'POST', body })
  const data = await res.json()
  return data
}
