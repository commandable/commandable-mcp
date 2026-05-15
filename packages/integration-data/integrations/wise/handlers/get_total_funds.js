async (input) => {
  const res = await integration.get(`/v1/profiles/${encodeURIComponent(input.profileId)}/total-funds/${encodeURIComponent(String(input.currency).toUpperCase())}`)
  const responseBodyText = await res.text()
  const responseBodyTrimmed = responseBodyText.trim()
  const funds = responseBodyTrimmed ? JSON.parse(responseBodyTrimmed) : null

  return {
    profileId: input.profileId,
    currency: String(input.currency).toUpperCase(),
    totalWorth: funds?.totalWorth,
    totalAvailable: funds?.totalAvailable,
    totalCash: funds?.totalCash,
    overdraft: funds?.overdraft,
    details: funds,
  }
}
