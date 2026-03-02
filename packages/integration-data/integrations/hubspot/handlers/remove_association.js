async (input) => {
  const body = {
    inputs: [
      {
        from: { id: String(input.fromObjectId) },
        to: { id: String(input.toObjectId) },
      },
    ],
  }

  const res = await integration.fetch(
    `/crm/v4/associations/${encodeURIComponent(input.fromObjectType)}/${encodeURIComponent(
      input.toObjectType
    )}/batch/archive`,
    {
      method: 'POST',
      body,
    }
  )
  return await res.json()
}

