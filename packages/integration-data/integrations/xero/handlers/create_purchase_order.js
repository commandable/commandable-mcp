async (input) => {
  const headers = input.tenantId ? { 'xero-tenant-id': input.tenantId } : {}
  const today = new Date().toISOString().slice(0, 10)
  const mapLineItem = item => ({
    Description: item.description,
    Quantity: item.quantity,
    UnitAmount: item.unitAmount,
    AccountCode: item.accountCode,
    TaxType: item.taxType,
    ...(item.itemCode ? { ItemCode: item.itemCode } : {}),
  })
  const summarizePurchaseOrder = po => ({
    purchaseOrderId: po?.PurchaseOrderID,
    purchaseOrderNumber: po?.PurchaseOrderNumber,
    status: po?.Status,
    contact: po?.Contact ? { contactId: po.Contact.ContactID, name: po.Contact.Name } : null,
    date: po?.DateString || po?.Date,
    deliveryDate: po?.DeliveryDateString || po?.DeliveryDate,
    total: po?.Total,
    lineItemCount: Array.isArray(po?.LineItems) ? po.LineItems.length : undefined,
  })
  const purchaseOrder = {
    Contact: { ContactID: input.contactId },
    LineItems: input.lineItems.map(mapLineItem),
    Date: input.date || today,
    Status: input.status || 'DRAFT',
    ...(input.deliveryDate ? { DeliveryDate: input.deliveryDate } : {}),
    ...(input.reference ? { Reference: input.reference } : {}),
    ...(input.extraFields || {}),
  }
  const res = await integration.post('/api.xro/2.0/PurchaseOrders', { PurchaseOrders: [purchaseOrder] }, { headers })
  const data = await res.json()
  const created = Array.isArray(data?.PurchaseOrders) ? data.PurchaseOrders[0] : null
  return {
    purchaseOrder: created ? summarizePurchaseOrder(created) : null,
  }
}
