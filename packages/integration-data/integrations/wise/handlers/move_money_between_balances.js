async (input) => {
  if (!input.quoteId && (input.amount === undefined || !input.currency))
    throw new Error('Provide quoteId for cross-currency movement, or amount and currency for same-currency movement')
  const makeIdempotenceUuid = () => `commandable-${Date.now()}-${Math.random().toString(16).slice(2)}`

  const body = {
    sourceBalanceId: input.sourceBalanceId,
    targetBalanceId: input.targetBalanceId,
    ...(input.quoteId ? { quoteId: input.quoteId } : {}),
    ...(input.amount !== undefined ? { amount: { value: input.amount, currency: String(input.currency).toUpperCase() } } : {}),
    ...(input.reference ? { reference: input.reference } : {}),
  }

  const res = await integration.post(`/v2/profiles/${encodeURIComponent(input.profileId)}/balance-movements`, body, {
    headers: {
      'X-idempotence-uuid': input.idempotenceUuid || makeIdempotenceUuid(),
    },
  })
  const movement = await res.json()

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
