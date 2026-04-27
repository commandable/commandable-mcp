async (input) => {
  const headers = input.tenantId ? { 'xero-tenant-id': input.tenantId } : {}
  const res = await integration.post('/api.xro/2.0/ManualJournals', { ManualJournals: [input.manualJournal] }, { headers })
  const data = await res.json()
  return {
    manualJournal: Array.isArray(data?.ManualJournals) ? data.ManualJournals[0] : null,
  }
}
