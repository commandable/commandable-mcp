async (input) => {
  const nowMs = Date.now()

  const props = {
    hs_note_body: input.body,
    hs_timestamp: input.timestamp !== undefined ? String(input.timestamp) : String(nowMs),
    ...(input.properties || {}),
  }

  if (input.hubspot_owner_id !== undefined) {
    props.hubspot_owner_id = String(input.hubspot_owner_id)
  }

  const createRes = await integration.fetch(`/crm/v3/objects/notes`, {
    method: 'POST',
    body: { properties: props },
  })
  const note = await createRes.json()

  const associationResults = []
  if (Array.isArray(input.associateWith) && input.associateWith.length > 0 && note?.id) {
    for (const a of input.associateWith) {
      const res = await integration.fetch(
        `/crm/v4/objects/notes/${encodeURIComponent(String(note.id))}/associations/default/${encodeURIComponent(
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

  return { note, associationResults }
}

