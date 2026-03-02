async (input) => {
  const props = { ...(input.properties || {}) }

  if (input.subject !== undefined) props.hs_task_subject = input.subject
  if (input.body !== undefined) props.hs_task_body = input.body
  if (input.status !== undefined) props.hs_task_status = input.status
  if (input.priority !== undefined) props.hs_task_priority = input.priority
  if (input.dueTimestamp !== undefined) props.hs_timestamp = String(input.dueTimestamp)
  if (input.hubspot_owner_id !== undefined) props.hubspot_owner_id = String(input.hubspot_owner_id)

  const res = await integration.fetch(`/crm/v3/objects/tasks/${encodeURIComponent(input.id)}`, {
    method: 'PATCH',
    body: { properties: props },
  })
  return await res.json()
}

