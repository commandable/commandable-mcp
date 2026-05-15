async (input) => {
  if (input.sourceAmount === undefined && input.targetAmount === undefined)
    throw new Error('Provide sourceAmount or targetAmount')

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
    createdTime: quote?.createdTime,
  })

  const body = {
    sourceCurrency: String(input.sourceCurrency).toUpperCase(),
    targetCurrency: String(input.targetCurrency).toUpperCase(),
    ...(input.sourceAmount !== undefined ? { sourceAmount: input.sourceAmount } : {}),
    ...(input.targetAmount !== undefined ? { targetAmount: input.targetAmount } : {}),
    ...(input.payOut ? { payOut: input.payOut } : {}),
    ...(input.preferredPayIn ? { preferredPayIn: input.preferredPayIn } : {}),
    ...(input.targetAccount !== undefined ? { targetAccount: input.targetAccount } : {}),
  }

  const res = await integration.post(`/v3/profiles/${encodeURIComponent(input.profileId)}/quotes`, body)
  const responseBodyText = await res.text()
  const responseBodyTrimmed = responseBodyText.trim()
  const quote = responseBodyTrimmed ? JSON.parse(responseBodyTrimmed) : null
  return { quote: summarizeQuote(quote) }
}
