async (input) => {
  const nowMs = Date.now()

  const props = {
    hs_task_subject: input.subject,
    hs_task_body: input.body,
    hs_task_status: input.status,
    hs_task_priority: input.priority,
    hs_timestamp:
      input.dueTimestamp !== undefined ? String(input.dueTimestamp) : String(nowMs),
    ...(input.properties || {}),
  }

  if (input.hubspot_owner_id !== undefined) {
    props.hubspot_owner_id = String(input.hubspot_owner_id)
  }

  const createRes = await integration.fetch(`/crm/v3/objects/tasks`, {
    method: 'POST',
    body: { properties: props },
  })
  const task = await createRes.json()

  const associationResults = []
  if (Array.isArray(input.associateWith) && input.associateWith.length > 0 && task?.id) {
    for (const a of input.associateWith) {
      const res = await integration.fetch(
        `/crm/v4/objects/tasks/${encodeURIComponent(String(task.id))}/associations/default/${encodeURIComponent(
          a.objectType
        )}/${encodeURIComponent(a.objectId)}`,
        { method: 'PUT' }
      )
      const text = await res.text()
      if (!text) {
        associationResults.push({ ok: res.ok, status: res.status })
      } else {
        try {
          associationResults.push(JSON.parse(text))
        } catch {
          associationResults.push({ ok: res.ok, status: res.status, body: text })
        }
      }
    }
  }

  return { task, associationResults }
}

