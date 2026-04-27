async (input) => {
  const headers = input.tenantId ? { 'xero-tenant-id': input.tenantId } : {}
  const res = await integration.get(`/api.xro/2.0/Invoices/${encodeURIComponent(input.id)}`, { headers })
  const data = await res.json()
  const invoice = Array.isArray(data?.Invoices) ? data.Invoices[0] : null
  const lineItems = Array.isArray(invoice?.LineItems)
    ? invoice.LineItems.map(line => ({
        lineItemId: line.LineItemID,
        description: line.Description,
        quantity: line.Quantity,
        unitAmount: line.UnitAmount,
        accountCode: line.AccountCode,
        taxType: line.TaxType,
        itemCode: line.ItemCode,
        lineAmount: line.LineAmount,
        tracking: line.Tracking,
      }))
    : []
  return {
    invoice: invoice
      ? {
          invoiceId: invoice.InvoiceID,
          invoiceNumber: invoice.InvoiceNumber,
          type: invoice.Type,
          status: invoice.Status,
          contact: invoice.Contact ? { contactId: invoice.Contact.ContactID, name: invoice.Contact.Name } : null,
          date: invoice.DateString || invoice.Date,
          dueDate: invoice.DueDateString || invoice.DueDate,
          currencyCode: invoice.CurrencyCode,
          subTotal: invoice.SubTotal,
          totalTax: invoice.TotalTax,
          total: invoice.Total,
          amountDue: invoice.AmountDue,
          amountPaid: invoice.AmountPaid,
          amountCredited: invoice.AmountCredited,
          reference: invoice.Reference,
          lineItems,
          payments: invoice.Payments,
          updatedDateUtc: invoice.UpdatedDateUTC,
        }
      : null,
  }
}
