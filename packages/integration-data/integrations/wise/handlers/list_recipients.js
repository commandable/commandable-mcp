async (input) => {
  const params = new URLSearchParams()
  if (input.profileId !== undefined) params.set('profile', String(input.profileId))
  if (input.currency) params.set('currency', String(input.currency).toUpperCase())
  if (input.size) params.set('size', String(input.size))
  if (input.seekPosition !== undefined) params.set('seekPosition', String(input.seekPosition))

  const res = await integration.get(`/v2/accounts${params.toString() ? `?${params}` : ''}`)
  const data = await res.json()
  const recipients = Array.isArray(data?.content) ? data.content : (Array.isArray(data) ? data : [])

  const summarizeRecipient = account => ({
    recipientId: account?.id,
    profileId: account?.profile,
    accountHolderName: account?.accountHolderName,
    currency: account?.currency,
    country: account?.country,
    type: account?.type,
    active: account?.active,
    ownedByCustomer: account?.ownedByCustomer,
    legalType: account?.legalType,
    bankName: account?.details?.bankName,
    accountSummary: account?.details?.accountNumber
      ? `...${String(account.details.accountNumber).slice(-4)}`
      : (account?.details?.iban ? `${String(account.details.iban).slice(0, 4)}...${String(account.details.iban).slice(-4)}` : undefined),
  })

  return {
    recipients: recipients.map(summarizeRecipient),
    count: recipients.length,
    seekPositionForNext: data?.seekPositionForNext,
  }
}
