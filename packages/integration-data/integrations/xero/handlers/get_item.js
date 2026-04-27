async (input) => {
  const headers = input.tenantId ? { 'xero-tenant-id': input.tenantId } : {}
  const res = await integration.get(`/api.xro/2.0/Items/${encodeURIComponent(input.id)}`, { headers })
  const data = await res.json()
  return {
    item: Array.isArray(data?.Items) ? data.Items[0] : null,
  }
}
