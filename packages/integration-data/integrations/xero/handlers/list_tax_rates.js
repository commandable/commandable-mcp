async (input) => {
  const headers = input.tenantId ? { 'xero-tenant-id': input.tenantId } : {}
  const res = await integration.get('/api.xro/2.0/TaxRates', { headers })
  const data = await res.json()
  const taxRates = Array.isArray(data?.TaxRates) ? data.TaxRates : []

  return {
    taxRates: taxRates.map(rate => ({
      name: rate.Name,
      taxType: rate.TaxType,
      status: rate.Status,
      displayTaxRate: rate.DisplayTaxRate,
      effectiveRate: rate.EffectiveRate,
      canApplyToAssets: rate.CanApplyToAssets,
      canApplyToEquity: rate.CanApplyToEquity,
      canApplyToExpenses: rate.CanApplyToExpenses,
      canApplyToLiabilities: rate.CanApplyToLiabilities,
      canApplyToRevenue: rate.CanApplyToRevenue,
    })),
    count: taxRates.length,
  }
}
