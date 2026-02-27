async (input) => {
  const path = `/${input.baseId}/${input.tableId}`
  const body = {
    records: [
      { id: input.recordId, fields: input.fields },
    ],
    typecast: !!input.typecast,
  }
  const res = await integration.fetch(path, { method: 'PATCH', body })
  return await res.json()
}
