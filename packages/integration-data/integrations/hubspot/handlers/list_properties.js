async (input) => {
  const params = new URLSearchParams()
  if (typeof input.archived === 'boolean') params.set('archived', String(input.archived))

  const suffix = params.toString() ? `?${params.toString()}` : ''
  const res = await integration.fetch(
    `/crm/v3/properties/${encodeURIComponent(input.objectType)}${suffix}`
  )
  return await res.json()
}

