async (input) => {
  const headers = input.tenantId ? { 'xero-tenant-id': input.tenantId } : {}
  const params = new URLSearchParams()
  if (input.page) params.set('page', String(input.page))
  if (input.where) params.set('where', input.where)
  if (input.order) params.set('order', input.order)
  if (input.status) params.set('Statuses', input.status)
  if (input.modifiedAfter) params.set('If-Modified-Since', input.modifiedAfter)
  const res = await integration.get(`/api.xro/2.0/BankTransactions${params.toString() ? `?${params}` : ''}`, { headers })
  const data = await res.json()
  const bankTransactions = Array.isArray(data?.BankTransactions) ? data.BankTransactions : []
  return {
    bankTransactions: bankTransactions.map(txn => ({
      bankTransactionId: txn.BankTransactionID,
      type: txn.Type,
      status: txn.Status,
      contact: txn.Contact ? { contactId: txn.Contact.ContactID, name: txn.Contact.Name } : null,
      bankAccount: txn.BankAccount ? { accountId: txn.BankAccount.AccountID, code: txn.BankAccount.Code, name: txn.BankAccount.Name } : null,
      date: txn.DateString || txn.Date,
      total: txn.Total,
      currencyCode: txn.CurrencyCode,
      updatedDateUtc: txn.UpdatedDateUTC,
    })),
    count: bankTransactions.length,
    page: input.page || 1,
  }
}
