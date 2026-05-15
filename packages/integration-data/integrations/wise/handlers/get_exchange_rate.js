async (input) => {
  const params = new URLSearchParams()
  params.set('source', String(input.sourceCurrency).toUpperCase())
  params.set('target', String(input.targetCurrency).toUpperCase())
  if (input.time) params.set('time', input.time)

  const res = await integration.get(`/v1/rates?${params}`)
  const data = await res.json()
  const rates = Array.isArray(data) ? data : []
  const rate = rates[0] || null

  return {
    sourceCurrency: String(input.sourceCurrency).toUpperCase(),
    targetCurrency: String(input.targetCurrency).toUpperCase(),
    rate: rate?.rate ?? null,
    time: rate?.time ?? input.time ?? null,
    rawCount: rates.length,
  }
}
