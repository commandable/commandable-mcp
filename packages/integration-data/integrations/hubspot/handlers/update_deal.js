async (input) => {
  const props = { ...(input.properties || {}) }
  if (input.dealname !== undefined) props.dealname = input.dealname
  if (input.amount !== undefined) props.amount = String(input.amount)
  if (input.pipeline !== undefined) props.pipeline = input.pipeline
  if (input.dealstage !== undefined) props.dealstage = input.dealstage
  if (input.closedate !== undefined) props.closedate = String(input.closedate)

  const body = { properties: props }
  const res = await integration.fetch(`/crm/v3/objects/deals/${encodeURIComponent(input.id)}`, {
    method: 'PATCH',
    body,
  })
  return await res.json()
}

