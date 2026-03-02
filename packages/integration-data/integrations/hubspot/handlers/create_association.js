async (input) => {
  const res = await integration.fetch(
    `/crm/v4/objects/${encodeURIComponent(input.fromObjectType)}/${encodeURIComponent(
      input.fromObjectId
    )}/associations/default/${encodeURIComponent(input.toObjectType)}/${encodeURIComponent(
      input.toObjectId
    )}`,
    { method: 'PUT' }
  )
  const text = await res.text()
  if (!text) return { ok: res.ok, status: res.status }
  try {
    return JSON.parse(text)
  } catch {
    return { ok: res.ok, status: res.status, body: text }
  }
}

