async (input) => {
  const summarizeQuote = quote => ({
    quoteId: quote?.id,
    profileId: quote?.profile,
    sourceCurrency: quote?.sourceCurrency,
    targetCurrency: quote?.targetCurrency,
    sourceAmount: quote?.sourceAmount,
    targetAmount: quote?.targetAmount,
    payOut: quote?.payOut,
    rate: quote?.rate,
    fee: quote?.fee,
    targetAccount: quote?.targetAccount,
    rateExpirationTime: quote?.rateExpirationTime,
    paymentOptions: Array.isArray(quote?.paymentOptions)
      ? quote.paymentOptions.map(option => ({
          payIn: option.payIn,
          payOut: option.payOut,
          sourceAmount: option.sourceAmount,
          targetAmount: option.targetAmount,
          fee: option.fee,
          estimatedDelivery: option.estimatedDelivery,
        }))
      : [],
  })

  const body = {
    ...(input.targetAccount !== undefined ? { targetAccount: input.targetAccount } : {}),
    ...(input.payOut ? { payOut: input.payOut } : {}),
    ...(input.preferredPayIn ? { preferredPayIn: input.preferredPayIn } : {}),
  }
  const res = await integration.patch(`/v3/profiles/${encodeURIComponent(input.profileId)}/quotes/${encodeURIComponent(input.quoteId)}`, body)
  const responseBodyText = await res.text()
  const responseBodyTrimmed = responseBodyText.trim()
  const quote = responseBodyTrimmed ? JSON.parse(responseBodyTrimmed) : null
  return { quote: summarizeQuote(quote) }
}
