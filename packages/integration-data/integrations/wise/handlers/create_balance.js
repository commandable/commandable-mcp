async (input) => {
  const body = {
    currency: String(input.currency).toUpperCase(),
    type: input.type,
    ...(input.name ? { name: input.name } : {}),
  }
  const res = await integration.post(`/v4/profiles/${encodeURIComponent(input.profileId)}/balances`, body, {
    headers: {
      'X-idempotence-uuid': uuid.v4(),
    },
  })
  const responseBodyText = await res.text()
  const responseBodyTrimmed = responseBodyText.trim()
  const balance = responseBodyTrimmed ? JSON.parse(responseBodyTrimmed) : null

  return {
    balance: {
      balanceId: balance?.id,
      currency: balance?.currency,
      type: balance?.type,
      name: balance?.name,
      amount: balance?.amount?.value ?? balance?.amount,
      investmentState: balance?.investmentState,
      creationTime: balance?.creationTime,
    },
  }
}
