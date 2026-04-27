async (input) => {
  const headers = input.tenantId ? { 'xero-tenant-id': input.tenantId } : {}
  const params = new URLSearchParams()
  if (input.contactId) params.set('contactID', input.contactId)
  if (input.date) params.set('date', input.date)
  const res = await integration.get(`/api.xro/2.0/Reports/AgedReceivablesByContact${params.toString() ? `?${params}` : ''}`, { headers })
  const data = await res.json()
  return {
    report: Array.isArray(data?.Reports) ? data.Reports[0] : null,
    query: Object.fromEntries(params.entries()),
  }
}
