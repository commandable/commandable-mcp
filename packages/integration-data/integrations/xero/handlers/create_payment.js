async (input) => {
  const headers = input.tenantId ? { 'xero-tenant-id': input.tenantId } : {}
  const today = new Date().toISOString().slice(0, 10)
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
  const summarizePayment = async (payment) => {
    const paymentId = payment?.PaymentID || ''
    const shortCode = paymentId ? await getShortCode() : ''
    return {
      paymentId,
      status: payment?.Status,
      date: payment?.DateString || payment?.Date,
      amount: payment?.Amount,
      reference: payment?.Reference,
      account: payment?.Account ? { accountId: payment.Account.AccountID, code: payment.Account.Code, name: payment.Account.Name } : null,
      invoice: payment?.Invoice ? { invoiceId: payment.Invoice.InvoiceID, invoiceNumber: payment.Invoice.InvoiceNumber } : null,
      xeroUrl: shortCode && paymentId ? `https://go.xero.com/organisationlogin/default.aspx?shortcode=${encodeURIComponent(shortCode)}&redirecturl=/Bank/ViewTransaction.aspx?bankTransactionID=${encodeURIComponent(paymentId)}` : null,
    }
  }
  const payment = {
    Invoice: { InvoiceID: input.invoiceId },
    Account: { AccountID: input.accountId },
    Amount: input.amount,
    Date: input.date || today,
    ...(input.reference ? { Reference: input.reference } : {}),
    ...(input.extraFields || {}),
  }
  const res = await integration.post('/api.xro/2.0/Payments', { Payments: [payment] }, { headers })
  const data = await res.json()
  const created = Array.isArray(data?.Payments) ? data.Payments[0] : null
  return {
    payment: created ? await summarizePayment(created) : null,
  }
}
