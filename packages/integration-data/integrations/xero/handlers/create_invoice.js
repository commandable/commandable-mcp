async (input) => {
  const headers = input.tenantId ? { 'xero-tenant-id': input.tenantId } : {}
  const res = await integration.post('/api.xro/2.0/Invoices', { Invoices: [input.invoice] }, { headers })
  const data = await res.json()
  return {
    invoice: Array.isArray(data?.Invoices) ? data.Invoices[0] : null,
  }
}
