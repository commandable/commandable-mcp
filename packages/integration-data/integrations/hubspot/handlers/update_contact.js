async (input) => {
  const props = { ...(input.properties || {}) }
  if (input.firstname !== undefined) props.firstname = input.firstname
  if (input.lastname !== undefined) props.lastname = input.lastname
  if (input.email !== undefined) props.email = input.email

  const body = { properties: props }
  const res = await integration.fetch(`/crm/v3/objects/contacts/${encodeURIComponent(input.id)}`, {
    method: 'PATCH',
    body,
  })
  return await res.json()
}

