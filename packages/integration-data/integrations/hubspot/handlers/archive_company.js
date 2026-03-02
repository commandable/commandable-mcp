async (input) => {
  const res = await integration.fetch(`/crm/v3/objects/companies/${encodeURIComponent(input.id)}`, {
    method: 'DELETE',
  })
  const text = await res.text()
  if (!text) return { ok: res.ok, status: res.status }
  try {
    return JSON.parse(text)
  } catch {
    return { ok: res.ok, status: res.status, body: text }
  }
}

