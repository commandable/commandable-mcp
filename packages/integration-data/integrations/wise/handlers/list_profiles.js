async () => {
  const res = await integration.get('/v2/profiles')
  const responseBodyText = await res.text()
  const responseBodyTrimmed = responseBodyText.trim()
  const profiles = responseBodyTrimmed ? JSON.parse(responseBodyTrimmed) : null
  const list = Array.isArray(profiles) ? profiles : []

  return {
    profiles: list.map(profile => ({
      profileId: profile.id,
      type: profile.type,
      name: profile.fullName || profile.name || profile.businessName,
      firstName: profile.firstName,
      lastName: profile.lastName,
      businessName: profile.businessName,
      email: profile.email,
      country: profile.address?.country,
      currency: profile.currency,
    })),
    count: list.length,
  }
}
