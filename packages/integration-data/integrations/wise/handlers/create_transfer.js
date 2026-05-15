async (input) => {
  const summarizeTransfer = transfer => {
    const transferId = transfer?.id
    return {
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
      fundingUrl: transferId ? `https://wise.com/transfer/${encodeURIComponent(transferId)}` : null,
      requiresAction: 'FUND_IN_WISE_UI',
      nextStep: 'Open Wise to fund this prepared transfer. The Wise API funding endpoint is intentionally not used by this integration.',
    }
  }

  const details = {
    ...(input.reference ? { reference: input.reference } : {}),
    ...(input.sourceOfFunds ? { sourceOfFunds: input.sourceOfFunds } : {}),
    ...(input.transferPurpose ? { transferPurpose: input.transferPurpose } : {}),
    ...(input.extraDetails || {}),
  }
  const body = {
    targetAccount: input.targetAccountId,
    quoteUuid: input.quoteId,
    customerTransactionId: uuid.v4(),
    ...(Object.keys(details).length ? { details } : {}),
  }

  const res = await integration.post('/v1/transfers', body)
  const responseBodyText = await res.text()
  const responseBodyTrimmed = responseBodyText.trim()
  const transfer = responseBodyTrimmed ? JSON.parse(responseBodyTrimmed) : null
  return { transfer: summarizeTransfer(transfer) }
}
