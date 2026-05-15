async (input) => {
  const res = await integration.get(`/v4/profiles/${encodeURIComponent(input.profileId)}/balances/${encodeURIComponent(input.balanceId)}`)
  const balance = await res.json()

  return {
    balance: {
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
      details: balance,
    },
  }
}
