async (input) => {
  const res = await integration.get(`/v2/accounts/${encodeURIComponent(input.recipientId)}`)
  const responseBodyText = await res.text()
  const responseBodyTrimmed = responseBodyText.trim()
  const account = responseBodyTrimmed ? JSON.parse(responseBodyTrimmed) : null

  return {
    recipient: {
      recipientId: account?.id,
      profileId: account?.profile,
      accountHolderName: account?.accountHolderName,
      currency: account?.currency,
      country: account?.country,
      type: account?.type,
      active: account?.active,
      ownedByCustomer: account?.ownedByCustomer,
      legalType: account?.legalType,
      details: account?.details,
      requirements: account?.requirements,
      created: account?.created,
      updated: account?.updated,
    },
  }
}
