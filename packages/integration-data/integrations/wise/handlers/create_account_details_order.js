async (input) => {
  const res = await integration.post(`/v1/profiles/${encodeURIComponent(input.profileId)}/account-details-orders`, {
    currency: String(input.currency).toUpperCase(),
  })
  const responseBodyText = await res.text()
  const responseBodyTrimmed = responseBodyText.trim()
  const order = responseBodyTrimmed ? JSON.parse(responseBodyTrimmed) : null

  return {
    order: {
      orderId: order?.id,
      currency: order?.currency,
      status: order?.status,
      requirements: order?.requirements,
      details: order,
    },
  }
}
