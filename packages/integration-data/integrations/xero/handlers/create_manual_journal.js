async (input) => {
  const headers = input.tenantId ? { 'xero-tenant-id': input.tenantId } : {}
  const today = new Date().toISOString().slice(0, 10)
  const mapJournalLine = line => ({
    LineAmount: line.lineAmount,
    AccountCode: line.accountCode,
    ...(line.description ? { Description: line.description } : {}),
    ...(line.taxType ? { TaxType: line.taxType } : {}),
  })
  const summarizeManualJournal = journal => ({
    manualJournalId: journal?.ManualJournalID,
    narration: journal?.Narration,
    status: journal?.Status,
    date: journal?.DateString || journal?.Date,
    lineAmountTypes: journal?.LineAmountTypes,
    showOnCashBasisReports: journal?.ShowOnCashBasisReports,
    journalLineCount: Array.isArray(journal?.JournalLines) ? journal.JournalLines.length : undefined,
    xeroUrl: journal?.ManualJournalID ? `https://go.xero.com/Journal/View.aspx?invoiceID=${encodeURIComponent(journal.ManualJournalID)}` : null,
  })
  const manualJournal = {
    Narration: input.narration,
    JournalLines: input.journalLines.map(mapJournalLine),
    Date: input.date || today,
    LineAmountTypes: input.lineAmountTypes || 'NO_TAX',
    Status: input.status || 'DRAFT',
    ...(input.url ? { Url: input.url } : {}),
    ...(input.showOnCashBasisReports !== undefined ? { ShowOnCashBasisReports: input.showOnCashBasisReports } : {}),
    ...(input.extraFields || {}),
  }
  const res = await integration.post('/api.xro/2.0/ManualJournals', { ManualJournals: [manualJournal] }, { headers })
  const data = await res.json()
  const created = Array.isArray(data?.ManualJournals) ? data.ManualJournals[0] : null
  return {
    manualJournal: created ? summarizeManualJournal(created) : null,
  }
}
