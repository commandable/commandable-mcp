async (input) => {
  const headers = input.tenantId ? { 'xero-tenant-id': input.tenantId } : {}
  const params = new URLSearchParams()
  if (input.page) params.set('page', String(input.page))
  if (input.where) params.set('where', input.where)
  if (input.order) params.set('order', input.order)
  if (input.status) params.set('Statuses', input.status)
  if (input.modifiedAfter) params.set('If-Modified-Since', input.modifiedAfter)
  const res = await integration.get(`/api.xro/2.0/ManualJournals${params.toString() ? `?${params}` : ''}`, { headers })
  const data = await res.json()
  const manualJournals = Array.isArray(data?.ManualJournals) ? data.ManualJournals : []
  return {
    manualJournals: manualJournals.map(journal => ({
      manualJournalId: journal.ManualJournalID,
      narration: journal.Narration,
      status: journal.Status,
      date: journal.DateString || journal.Date,
      lineAmountTypes: journal.LineAmountTypes,
      journalLineCount: Array.isArray(journal.JournalLines) ? journal.JournalLines.length : undefined,
      updatedDateUtc: journal.UpdatedDateUTC,
    })),
    count: manualJournals.length,
    page: input.page || 1,
  }
}
