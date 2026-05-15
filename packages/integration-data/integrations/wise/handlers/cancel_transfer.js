async (input) => {
  const res = await integration.put(`/v1/transfers/${encodeURIComponent(input.transferId)}/cancel`, {})
  const responseBodyText = await res.text()
  const responseBodyTrimmed = responseBodyText.trim()
  const transfer = responseBodyTrimmed ? JSON.parse(responseBodyTrimmed) : {}

  return {
    transfer: {
      transferId: transfer?.id || input.transferId,
      status: transfer?.status,
      targetAccountId: transfer?.targetAccount,
      quoteId: transfer?.quoteUuid,
      customerTransactionId: transfer?.customerTransactionId,
      cancelled: transfer?.status === 'cancelled' || transfer?.status === 'cancelled_by_user',
    },
  }
}
