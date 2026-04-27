async (input) => {
  const headers = input.tenantId ? { 'xero-tenant-id': input.tenantId } : {}
  const params = new URLSearchParams()
  if (input.where) params.set('where', input.where)
  if (input.order) params.set('order', input.order)
  const path = `/api.xro/2.0/Accounts${params.toString() ? `?${params}` : ''}`
  const res = await integration.get(path, { headers })
  const data = await res.json()
  const accounts = Array.isArray(data?.Accounts) ? data.Accounts : []

  return {
    accounts: accounts.map(account => ({
      accountId: account.AccountID,
      code: account.Code,
      name: account.Name,
      type: account.Type,
      class: account.Class,
      status: account.Status,
      taxType: account.TaxType,
      enablePaymentsToAccount: account.EnablePaymentsToAccount,
      bankAccountNumber: account.BankAccountNumber,
      currencyCode: account.CurrencyCode,
    })),
    count: accounts.length,
  }
}
