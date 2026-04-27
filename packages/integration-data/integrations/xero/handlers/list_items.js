async (input) => {
  const headers = input.tenantId ? { 'xero-tenant-id': input.tenantId } : {}
  const params = new URLSearchParams()
  if (input.page) params.set('page', String(input.page))
  if (input.where) params.set('where', input.where)
  if (input.order) params.set('order', input.order)
  if (input.modifiedAfter) params.set('If-Modified-Since', input.modifiedAfter)
  const res = await integration.get(`/api.xro/2.0/Items${params.toString() ? `?${params}` : ''}`, { headers })
  const data = await res.json()
  const items = Array.isArray(data?.Items) ? data.Items : []

  return {
    items: items.map(item => ({
      itemId: item.ItemID,
      code: item.Code,
      name: item.Name,
      description: item.Description,
      isTrackedAsInventory: item.IsTrackedAsInventory,
      isSold: item.IsSold,
      isPurchased: item.IsPurchased,
      salesDetails: item.SalesDetails,
      purchaseDetails: item.PurchaseDetails,
      updatedDateUtc: item.UpdatedDateUTC,
    })),
    count: items.length,
    page: input.page || 1,
  }
}
