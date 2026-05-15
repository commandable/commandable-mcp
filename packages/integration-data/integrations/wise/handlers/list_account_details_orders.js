async (input) => {
  const currency = encodeURIComponent(String(input.currency).toUpperCase())
  const res = await integration.get(`/v3/profiles/${encodeURIComponent(input.profileId)}/account-details-orders?currency=${currency}`)
  const responseBodyText = await res.text()
  const responseBodyTrimmed = responseBodyText.trim()
  const data = responseBodyTrimmed ? JSON.parse(responseBodyTrimmed) : null
  const orders = Array.isArray(data) ? data : []

  return {
    orders: orders.map(order => ({
      orderId: order?.id,
      currency: order?.currency,
      status: order?.status,
      requirements: order?.requirements,
      createdTime: order?.createdTime,
      updatedTime: order?.updatedTime,
    })),
    count: orders.length,
  }
}
