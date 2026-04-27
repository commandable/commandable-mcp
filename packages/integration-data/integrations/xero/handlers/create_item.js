async (input) => {
  const headers = input.tenantId ? { 'xero-tenant-id': input.tenantId } : {}
  const item = {
    ...(input.code ? { Code: input.code } : {}),
    ...(input.name ? { Name: input.name } : {}),
    ...(input.description ? { Description: input.description } : {}),
    ...(input.item || {}),
  }
  const res = await integration.post('/api.xro/2.0/Items', { Items: [item] }, { headers })
  const data = await res.json()
  return {
    item: Array.isArray(data?.Items) ? data.Items[0] : null,
  }
}
