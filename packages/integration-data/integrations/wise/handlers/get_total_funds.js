async (input) => {
  const res = await integration.get(`/v1/profiles/${encodeURIComponent(input.profileId)}/total-funds/${encodeURIComponent(String(input.currency).toUpperCase())}`)
  const funds = await res.json()

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
