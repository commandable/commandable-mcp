async (input) => {
  const params = new URLSearchParams()

  if (Array.isArray(input.properties)) {
    for (const p of input.properties) params.append('properties', p)
  }

  if (Array.isArray(input.associations)) {
    for (const a of input.associations) params.append('associations', a)
  }

  if (typeof input.archived === 'boolean') params.set('archived', String(input.archived))

  const suffix = params.toString() ? `?${params.toString()}` : ''
  const res = await integration.fetch(`/crm/v3/objects/deals/${encodeURIComponent(input.id)}${suffix}`)
  return await res.json()
}

