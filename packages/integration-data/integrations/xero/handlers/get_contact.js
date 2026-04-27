async (input) => {
  const headers = input.tenantId ? { 'xero-tenant-id': input.tenantId } : {}
  const res = await integration.get(`/api.xro/2.0/Contacts/${encodeURIComponent(input.id)}`, { headers })
  const data = await res.json()
  const contacts = Array.isArray(data?.Contacts) ? data.Contacts : []

  return {
    contact: contacts[0] || null,
  }
}
