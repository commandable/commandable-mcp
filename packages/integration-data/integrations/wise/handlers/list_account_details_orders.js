async (input) => {
  const res = await integration.get(`/v3/profiles/${encodeURIComponent(input.profileId)}/account-details-orders`)
  const data = await res.json()
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
