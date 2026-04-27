async (input) => {
  const headers = input.tenantId ? { 'xero-tenant-id': input.tenantId } : {}
  const today = new Date().toISOString().slice(0, 10)
  const defaultDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
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
      currencyCode: invoice?.CurrencyCode,
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
  if (!input.contactId)
    throw new Error('contactId is required for create_invoice')
  if (!Array.isArray(input.lineItems) || !input.lineItems.length)
    throw new Error('lineItems is required for create_invoice')
  const invoice = {
    Type: input.type || 'ACCREC',
    Contact: { ContactID: input.contactId },
    LineItems: input.lineItems.map(mapLineItem),
    Date: input.date || today,
    DueDate: input.dueDate || defaultDueDate,
    Status: input.status || 'DRAFT',
    ...(input.reference ? { Reference: input.reference } : {}),
    ...(input.extraFields || {}),
  }
  const res = await integration.post('/api.xro/2.0/Invoices', { Invoices: [invoice] }, { headers })
  const data = await res.json()
  const created = Array.isArray(data?.Invoices) ? data.Invoices[0] : null
  return {
    invoice: created ? await summarizeInvoice(created) : null,
  }
}
