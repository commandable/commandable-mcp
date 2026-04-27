async (input) => {
  const headers = input.tenantId ? { 'xero-tenant-id': input.tenantId } : {}
  const params = new URLSearchParams()
  if (input.page) params.set('page', String(input.page))
  if (input.where) params.set('where', input.where)
  if (input.order) params.set('order', input.order)
  if (input.status) params.set('Statuses', input.status)
  if (input.modifiedAfter) params.set('If-Modified-Since', input.modifiedAfter)
  const res = await integration.get(`/api.xro/2.0/PurchaseOrders${params.toString() ? `?${params}` : ''}`, { headers })
  const data = await res.json()
  const purchaseOrders = Array.isArray(data?.PurchaseOrders) ? data.PurchaseOrders : []
  return {
    purchaseOrders: purchaseOrders.map(po => ({
      purchaseOrderId: po.PurchaseOrderID,
      purchaseOrderNumber: po.PurchaseOrderNumber,
      status: po.Status,
      contact: po.Contact ? { contactId: po.Contact.ContactID, name: po.Contact.Name } : null,
      date: po.DateString || po.Date,
      deliveryDate: po.DeliveryDateString || po.DeliveryDate,
      total: po.Total,
      currencyCode: po.CurrencyCode,
      updatedDateUtc: po.UpdatedDateUTC,
    })),
    count: purchaseOrders.length,
    page: input.page || 1,
  }
}
