async (input) => {
  const params = new URLSearchParams()
  if (input?.after) params.set('after', String(input.after))
  if (input?.limit) params.set('limit', String(input.limit))

  const suffix = params.toString() ? `?${params.toString()}` : ''
  const res = await integration.fetch(
    `/crm/v4/objects/${encodeURIComponent(input.fromObjectType)}/${encodeURIComponent(
      input.fromObjectId
    )}/associations/${encodeURIComponent(input.toObjectType)}${suffix}`
  )
  return await res.json()
}

