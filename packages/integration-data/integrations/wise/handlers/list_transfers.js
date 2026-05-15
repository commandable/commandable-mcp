async (input) => {
  const params = new URLSearchParams()
  if (input.profileId !== undefined) params.set('profile', String(input.profileId))
  if (input.status) params.set('status', input.status)
  if (input.sourceCurrency) params.set('sourceCurrency', String(input.sourceCurrency).toUpperCase())
  if (input.targetCurrency) params.set('targetCurrency', String(input.targetCurrency).toUpperCase())
  if (input.createdDateStart) params.set('createdDateStart', input.createdDateStart)
  if (input.createdDateEnd) params.set('createdDateEnd', input.createdDateEnd)
  if (input.limit) params.set('limit', String(input.limit))
  if (input.offset) params.set('offset', String(input.offset))

  const res = await integration.get(`/v1/transfers${params.toString() ? `?${params}` : ''}`)
  const data = await res.json()
  const transfers = Array.isArray(data) ? data : (Array.isArray(data?.content) ? data.content : [])

  return {
    transfers: transfers.map(transfer => ({
      transferId: transfer?.id,
      status: transfer?.status,
      targetAccountId: transfer?.targetAccount,
      quoteId: transfer?.quoteUuid,
      customerTransactionId: transfer?.customerTransactionId,
      reference: transfer?.details?.reference,
      sourceCurrency: transfer?.sourceCurrency,
      targetCurrency: transfer?.targetCurrency,
      sourceValue: transfer?.sourceValue,
      targetValue: transfer?.targetValue,
      created: transfer?.created,
      estimatedDelivery: transfer?.estimatedDelivery,
    })),
    count: transfers.length,
  }
}
