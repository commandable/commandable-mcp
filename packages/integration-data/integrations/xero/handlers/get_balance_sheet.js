async (input) => {
  const headers = input.tenantId ? { 'xero-tenant-id': input.tenantId } : {}
  const params = new URLSearchParams()
  if (input.date) params.set('date', input.date)
  if (input.periods) params.set('periods', String(input.periods))
  if (input.timeframe) params.set('timeframe', input.timeframe)
  if (input.trackingCategoryId) params.set('trackingCategoryID', input.trackingCategoryId)
  if (input.trackingOptionId) params.set('trackingOptionID', input.trackingOptionId)
  const res = await integration.get(`/api.xro/2.0/Reports/BalanceSheet${params.toString() ? `?${params}` : ''}`, { headers })
  const data = await res.json()
  return {
    report: Array.isArray(data?.Reports) ? data.Reports[0] : null,
    query: Object.fromEntries(params.entries()),
  }
}
