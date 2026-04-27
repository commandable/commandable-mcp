async (input) => {
  if (!input.invoiceId)
    throw new Error('invoiceId is required for update_invoice')
  const headers = input.tenantId ? { 'xero-tenant-id': input.tenantId } : {}
  const mapTracking = tracking => Array.isArray(tracking)
    ? tracking.map(item => ({
        Name: item.name,
        Option: item.option,
        ...(item.trackingCategoryId ? { TrackingCategoryID: item.trackingCategoryId } : {}),
      }))
    : undefined
  const mapLineItem = item => ({
    Description: item.description,
    Quantity: item.quantity,
    UnitAmount: item.unitAmount,
    AccountCode: item.accountCode,
    TaxType: item.taxType,
    ...(item.itemCode ? { ItemCode: item.itemCode } : {}),
    ...(item.tracking ? { Tracking: mapTracking(item.tracking) } : {}),
  })
  const getShortCode = async () => {
    try {
      const orgRes = await integration.get('/api.xro/2.0/Organisation', { headers })
      const orgData = await orgRes.json()
      return Array.isArray(orgData?.Organisations) ? orgData.Organisations[0]?.ShortCode : ''
    }
    catch {
      return ''
    }
  }
  const summarizeInvoice = async (invoice) => {
    const invoiceId = invoice?.InvoiceID || ''
    const shortCode = invoiceId ? await getShortCode() : ''
    const isBill = invoice?.Type === 'ACCPAY'
    return {
      invoiceId,
      invoiceNumber: invoice?.InvoiceNumber,
      type: invoice?.Type,
      status: invoice?.Status,
      contact: invoice?.Contact ? { contactId: invoice.Contact.ContactID, name: invoice.Contact.Name } : null,
      date: invoice?.DateString || invoice?.Date,
      dueDate: invoice?.DueDateString || invoice?.DueDate,
      total: invoice?.Total,
      amountDue: invoice?.AmountDue,
      lineItemCount: Array.isArray(invoice?.LineItems) ? invoice.LineItems.length : undefined,
      xeroUrl: shortCode && invoiceId
        ? (isBill
            ? `https://go.xero.com/organisationlogin/default.aspx?shortcode=${encodeURIComponent(shortCode)}&redirecturl=/AccountsPayable/Edit.aspx?InvoiceID=${encodeURIComponent(invoiceId)}`
            : `https://go.xero.com/app/${encodeURIComponent(shortCode)}/invoicing/view/${encodeURIComponent(invoiceId)}`)
        : null,
    }
  }
  const invoice = {
    InvoiceID: input.invoiceId,
    ...(input.contactId ? { Contact: { ContactID: input.contactId } } : {}),
    ...(Array.isArray(input.lineItems) ? { LineItems: input.lineItems.map(mapLineItem) } : {}),
    ...(input.type ? { Type: input.type } : {}),
    ...(input.reference ? { Reference: input.reference } : {}),
    ...(input.date ? { Date: input.date } : {}),
    ...(input.dueDate ? { DueDate: input.dueDate } : {}),
    ...(input.status ? { Status: input.status } : {}),
    ...(input.extraFields || {}),
  }
  const res = await integration.post(`/api.xro/2.0/Invoices/${encodeURIComponent(input.invoiceId)}`, { Invoices: [invoice] }, { headers })
  const data = await res.json()
  const updated = Array.isArray(data?.Invoices) ? data.Invoices[0] : null
  return {
    invoice: updated ? await summarizeInvoice(updated) : null,
  }
}
