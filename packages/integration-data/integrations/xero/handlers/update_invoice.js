async (input) => {
  if (!input.invoiceId)
    throw new Error('invoiceId is required for update_invoice')
  const headers = input.tenantId ? { 'xero-tenant-id': input.tenantId } : {}
  const invoice = { InvoiceID: input.invoiceId, ...(input.invoice || {}) }
  const res = await integration.post(`/api.xro/2.0/Invoices/${encodeURIComponent(input.invoiceId)}`, { Invoices: [invoice] }, { headers })
  const data = await res.json()
  return {
    invoice: Array.isArray(data?.Invoices) ? data.Invoices[0] : null,
  }
}
