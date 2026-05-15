async (input) => {
  if (!input.quoteId && (input.amount === undefined || !input.currency))
    throw new Error('Provide quoteId for cross-currency movement, or amount and currency for same-currency movement')

  const body = {
    sourceBalanceId: input.sourceBalanceId,
    targetBalanceId: input.targetBalanceId,
    ...(input.quoteId ? { quoteId: input.quoteId } : {}),
    ...(input.amount !== undefined ? { amount: { value: input.amount, currency: String(input.currency).toUpperCase() } } : {}),
    ...(input.reference ? { reference: input.reference } : {}),
  }

  const res = await integration.post(`/v2/profiles/${encodeURIComponent(input.profileId)}/balance-movements`, body, {
    headers: {
      'X-idempotence-uuid': uuid.v4(),
    },
  })
  const responseBodyText = await res.text()
  const responseBodyTrimmed = responseBodyText.trim()
  const movement = responseBodyTrimmed ? JSON.parse(responseBodyTrimmed) : null

  return {
    movement: {
      movementId: movement?.id,
      status: movement?.status,
      sourceBalanceId: movement?.sourceBalanceId ?? input.sourceBalanceId,
      targetBalanceId: movement?.targetBalanceId ?? input.targetBalanceId,
      quoteId: movement?.quoteId ?? input.quoteId,
      amount: movement?.amount,
      createdTime: movement?.createdTime,
      details: movement,
    },
  }
}
