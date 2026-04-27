async (input) => {
  const headers = input.tenantId ? { 'xero-tenant-id': input.tenantId } : {}
  const res = await integration.post('/api.xro/2.0/Quotes', { Quotes: [input.quote] }, { headers })
  const data = await res.json()
  return {
    quote: Array.isArray(data?.Quotes) ? data.Quotes[0] : null,
  }
}
