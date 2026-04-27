async (input) => {
  const headers = input.tenantId ? { 'xero-tenant-id': input.tenantId } : {}
  const res = await integration.post('/api.xro/2.0/PurchaseOrders', { PurchaseOrders: [input.purchaseOrder] }, { headers })
  const data = await res.json()
  return {
    purchaseOrder: Array.isArray(data?.PurchaseOrders) ? data.PurchaseOrders[0] : null,
  }
}
