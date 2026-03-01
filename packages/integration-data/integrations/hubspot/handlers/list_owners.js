async (input) => {
  const params = new URLSearchParams()
  if (input?.email) params.set('email', input.email)
  if (input?.after) params.set('after', String(input.after))
  if (input?.limit) params.set('limit', String(input.limit))
  if (typeof input?.archived === 'boolean') params.set('archived', String(input.archived))

  const suffix = params.toString() ? `?${params.toString()}` : ''
  const res = await integration.fetch(`/crm/v3/owners/${suffix}`)
  return await res.json()
}

