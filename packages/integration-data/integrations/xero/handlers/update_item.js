async (input) => {
  if (!input.itemId)
    throw new Error('itemId is required for update_item')
  const headers = input.tenantId ? { 'xero-tenant-id': input.tenantId } : {}
  const item = {
    ItemID: input.itemId,
    ...(input.code ? { Code: input.code } : {}),
    ...(input.name ? { Name: input.name } : {}),
    ...(input.description ? { Description: input.description } : {}),
    ...(input.item || {}),
  }
  const res = await integration.post(`/api.xro/2.0/Items/${encodeURIComponent(input.itemId)}`, { Items: [item] }, { headers })
  const data = await res.json()
  return {
    item: Array.isArray(data?.Items) ? data.Items[0] : null,
  }
}
