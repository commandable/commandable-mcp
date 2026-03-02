async (input) => {
  const props = { ...(input.properties || {}) }
  if (input.subject !== undefined) props.subject = input.subject
  if (input.content !== undefined) props.content = input.content
  if (input.hs_pipeline !== undefined) props.hs_pipeline = input.hs_pipeline
  if (input.hs_pipeline_stage !== undefined) props.hs_pipeline_stage = input.hs_pipeline_stage

  const body = { properties: props }
  const res = await integration.fetch(`/crm/v3/objects/tickets/${encodeURIComponent(input.id)}`, {
    method: 'PATCH',
    body,
  })
  return await res.json()
}

