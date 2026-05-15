async (input) => {
  const res = await integration.get(`/v1/transfers/${encodeURIComponent(input.transferId)}`)
  const transfer = await res.json()
  const transferId = transfer?.id || input.transferId

  return {
    transfer: {
      transferId,
      status: transfer?.status,
      targetAccountId: transfer?.targetAccount,
      quoteId: transfer?.quoteUuid,
      customerTransactionId: transfer?.customerTransactionId,
      reference: transfer?.details?.reference,
      sourceCurrency: transfer?.sourceCurrency,
      targetCurrency: transfer?.targetCurrency,
      sourceValue: transfer?.sourceValue,
      targetValue: transfer?.targetValue,
      rate: transfer?.rate,
      created: transfer?.created,
      estimatedDelivery: transfer?.estimatedDelivery,
      fundingUrl: `https://wise.com/transfer/${encodeURIComponent(transferId)}`,
    },
  }
}
