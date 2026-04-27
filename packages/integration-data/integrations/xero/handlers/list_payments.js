async (input) => {
  const headers = input.tenantId ? { 'xero-tenant-id': input.tenantId } : {}
  const params = new URLSearchParams()
  if (input.page) params.set('page', String(input.page))
  if (input.where) params.set('where', input.where)
  if (input.order) params.set('order', input.order)
  if (input.fromDate || input.toDate) {
    const clauses = []
    if (input.fromDate) clauses.push(`Date >= DateTime(${input.fromDate.replace(/-/g, ',')})`)
    if (input.toDate) clauses.push(`Date <= DateTime(${input.toDate.replace(/-/g, ',')})`)
    params.set('where', input.where ? `${input.where}&&${clauses.join('&&')}` : clauses.join('&&'))
  }
  if (input.modifiedAfter) params.set('If-Modified-Since', input.modifiedAfter)
  const res = await integration.get(`/api.xro/2.0/Payments${params.toString() ? `?${params}` : ''}`, { headers })
  const data = await res.json()
  const payments = Array.isArray(data?.Payments) ? data.Payments : []
  return {
    payments: payments.map(payment => ({
      paymentId: payment.PaymentID,
      status: payment.Status,
      date: payment.DateString || payment.Date,
      amount: payment.Amount,
      currencyRate: payment.CurrencyRate,
      account: payment.Account ? { accountId: payment.Account.AccountID, code: payment.Account.Code, name: payment.Account.Name } : null,
      invoice: payment.Invoice ? { invoiceId: payment.Invoice.InvoiceID, invoiceNumber: payment.Invoice.InvoiceNumber } : null,
      updatedDateUtc: payment.UpdatedDateUTC,
    })),
    count: payments.length,
    page: input.page || 1,
  }
}
