async (input) => {
  const params = new URLSearchParams()
  const types = Array.isArray(input.types) && input.types.length ? input.types : ['STANDARD', 'SAVINGS']
  params.set('types', types.join(','))

  const res = await integration.get(`/v4/profiles/${encodeURIComponent(input.profileId)}/balances?${params}`)
  const responseBodyText = await res.text()
  const responseBodyTrimmed = responseBodyText.trim()
  const data = responseBodyTrimmed ? JSON.parse(responseBodyTrimmed) : null
  const balances = Array.isArray(data) ? data : []

  return {
    balances: balances.map(balance => ({
      balanceId: balance?.id,
      currency: balance?.currency,
      type: balance?.type,
      name: balance?.name,
      amount: balance?.amount?.value ?? balance?.amount,
      reservedAmount: balance?.reservedAmount?.value ?? balance?.reservedAmount,
      cashAmount: balance?.cashAmount?.value ?? balance?.cashAmount,
      totalWorth: balance?.totalWorth?.value ?? balance?.totalWorth,
      investmentState: balance?.investmentState,
      creationTime: balance?.creationTime,
      modificationTime: balance?.modificationTime,
    })),
    count: balances.length,
  }
}
