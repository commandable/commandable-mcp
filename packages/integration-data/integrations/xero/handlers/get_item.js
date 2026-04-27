async (input) => {
  const headers = input.tenantId ? { 'xero-tenant-id': input.tenantId } : {}
  const res = await integration.get(`/api.xro/2.0/Items/${encodeURIComponent(input.id)}`, { headers })
  const data = await res.json()
  const item = Array.isArray(data?.Items) ? data.Items[0] : null
  return {
    item: item
      ? {
          itemId: item.ItemID,
          code: item.Code,
          name: item.Name,
          description: item.Description,
          purchaseDescription: item.PurchaseDescription,
          isTrackedAsInventory: item.IsTrackedAsInventory,
          isSold: item.IsSold,
          isPurchased: item.IsPurchased,
          salesDetails: item.SalesDetails,
          purchaseDetails: item.PurchaseDetails,
          updatedDateUtc: item.UpdatedDateUTC,
        }
      : null,
  }
}
