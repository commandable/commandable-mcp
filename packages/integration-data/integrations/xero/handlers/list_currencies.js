async (input) => {
  const headers = input.tenantId ? { 'xero-tenant-id': input.tenantId } : {}
  const res = await integration.get('/api.xro/2.0/Currencies', { headers })
  const data = await res.json()
  const currencies = Array.isArray(data?.Currencies) ? data.Currencies : []

  return {
    currencies: currencies.map(currency => ({
      code: currency.Code,
      description: currency.Description,
    })),
    count: currencies.length,
  }
}
