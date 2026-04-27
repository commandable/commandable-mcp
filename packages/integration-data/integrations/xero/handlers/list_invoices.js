async (input) => {
  const headers = input.tenantId ? { 'xero-tenant-id': input.tenantId } : {}
  const params = new URLSearchParams()
  if (input.page) params.set('page', String(input.page))
  if (input.where) params.set('where', input.where)
  if (input.order) params.set('order', input.order)
  if (input.status) params.set('Statuses', input.status)
  if (input.modifiedAfter) params.set('If-Modified-Since', input.modifiedAfter)
  const res = await integration.get(`/api.xro/2.0/Invoices${params.toString() ? `?${params}` : ''}`, { headers })
  const data = await res.json()
  const invoices = Array.isArray(data?.Invoices) ? data.Invoices : []

  return {
    invoices: invoices.map(invoice => ({
      invoiceId: invoice.InvoiceID,
      invoiceNumber: invoice.InvoiceNumber,
      type: invoice.Type,
      status: invoice.Status,
      contact: invoice.Contact ? { contactId: invoice.Contact.ContactID, name: invoice.Contact.Name } : null,
      date: invoice.DateString || invoice.Date,
      dueDate: invoice.DueDateString || invoice.DueDate,
      currencyCode: invoice.CurrencyCode,
      total: invoice.Total,
      amountDue: invoice.AmountDue,
      amountPaid: invoice.AmountPaid,
      updatedDateUtc: invoice.UpdatedDateUTC,
    })),
    count: invoices.length,
    page: input.page || 1,
  }
}
