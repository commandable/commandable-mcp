async (input) => {
  const props = { ...(input.properties || {}) }
  if (input.name !== undefined) props.name = input.name
  if (input.domain !== undefined) props.domain = input.domain

  const body = { properties: props }
  const res = await integration.fetch(`/crm/v3/objects/companies/${encodeURIComponent(input.id)}`, {
    method: 'PATCH',
    body,
  })
  return await res.json()
}

