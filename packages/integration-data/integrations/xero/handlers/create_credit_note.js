async (input) => {
  const headers = input.tenantId ? { 'xero-tenant-id': input.tenantId } : {}
  const res = await integration.post('/api.xro/2.0/CreditNotes', { CreditNotes: [input.creditNote] }, { headers })
  const data = await res.json()
  return {
    creditNote: Array.isArray(data?.CreditNotes) ? data.CreditNotes[0] : null,
  }
}
