async (input) => {
  const headers = input.tenantId ? { 'xero-tenant-id': input.tenantId } : {}
  const res = await integration.post('/api.xro/2.0/Payments', { Payments: [input.payment] }, { headers })
  const data = await res.json()
  return {
    payment: Array.isArray(data?.Payments) ? data.Payments[0] : null,
  }
}
