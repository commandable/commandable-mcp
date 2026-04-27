async (input) => {
  const headers = input.tenantId ? { 'xero-tenant-id': input.tenantId } : {}
  const today = new Date().toISOString().slice(0, 10)
  const mapLineItem = item => ({
    Description: item.description,
    Quantity: item.quantity,
    UnitAmount: item.unitAmount,
    AccountCode: item.accountCode,
    TaxType: item.taxType,
  })
  const summarizeBankTransaction = txn => ({
    bankTransactionId: txn?.BankTransactionID,
    type: txn?.Type,
    status: txn?.Status,
    contact: txn?.Contact ? { contactId: txn.Contact.ContactID, name: txn.Contact.Name } : null,
    bankAccount: txn?.BankAccount ? { accountId: txn.BankAccount.AccountID, code: txn.BankAccount.Code, name: txn.BankAccount.Name } : null,
    date: txn?.DateString || txn?.Date,
    reference: txn?.Reference,
    total: txn?.Total,
    lineItemCount: Array.isArray(txn?.LineItems) ? txn.LineItems.length : undefined,
    xeroUrl: txn?.BankAccount?.AccountID && txn?.BankTransactionID
      ? `https://go.xero.com/Bank/ViewTransaction.aspx?bankTransactionID=${encodeURIComponent(txn.BankTransactionID)}&accountID=${encodeURIComponent(txn.BankAccount.AccountID)}`
      : null,
  })
  const bankTransaction = {
    Type: input.type,
    BankAccount: { AccountID: input.bankAccountId },
    Contact: { ContactID: input.contactId },
    LineItems: input.lineItems.map(mapLineItem),
    Date: input.date || today,
    Status: input.status || 'DRAFT',
    ...(input.reference ? { Reference: input.reference } : {}),
    ...(input.extraFields || {}),
  }
  const res = await integration.post('/api.xro/2.0/BankTransactions', { BankTransactions: [bankTransaction] }, { headers })
  const data = await res.json()
  const created = Array.isArray(data?.BankTransactions) ? data.BankTransactions[0] : null
  return {
    bankTransaction: created ? summarizeBankTransaction(created) : null,
  }
}
