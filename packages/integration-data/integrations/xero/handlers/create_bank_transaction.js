async (input) => {
  const headers = input.tenantId ? { 'xero-tenant-id': input.tenantId } : {}
  const res = await integration.post('/api.xro/2.0/BankTransactions', { BankTransactions: [input.bankTransaction] }, { headers })
  const data = await res.json()
  return {
    bankTransaction: Array.isArray(data?.BankTransactions) ? data.BankTransactions[0] : null,
  }
}
