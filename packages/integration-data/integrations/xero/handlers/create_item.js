async (input) => {
  const headers = input.tenantId ? { 'xero-tenant-id': input.tenantId } : {}
  const summarizeItem = item => ({
    itemId: item?.ItemID,
    code: item?.Code,
    name: item?.Name,
    description: item?.Description,
    isSold: item?.IsSold,
    isPurchased: item?.IsPurchased,
  })
  const item = {
    ...(input.code ? { Code: input.code } : {}),
    ...(input.name ? { Name: input.name } : {}),
    ...(input.description ? { Description: input.description } : {}),
    ...(input.extraFields || {}),
  }
  const res = await integration.post('/api.xro/2.0/Items', { Items: [item] }, { headers })
  const data = await res.json()
  const created = Array.isArray(data?.Items) ? data.Items[0] : null
  return {
    item: created ? summarizeItem(created) : null,
  }
}
