async (input) => {
  const headers = input.tenantId ? { 'xero-tenant-id': input.tenantId } : {}
  const params = new URLSearchParams()
  if (input.contactId) params.set('contactId', input.contactId)
  if (input.date) params.set('date', input.date)
  const res = await integration.get(`/api.xro/2.0/Reports/AgedPayablesByContact${params.toString() ? `?${params}` : ''}`, { headers })
  const data = await res.json()
  const report = Array.isArray(data?.Reports) ? data.Reports[0] : null
  const rows = Array.isArray(report?.Rows)
    ? report.Rows.map(row => ({
        rowType: row.RowType,
        title: row.Title,
        cells: Array.isArray(row.Cells) ? row.Cells.map(cell => cell.Value) : [],
        rows: Array.isArray(row.Rows)
          ? row.Rows.map(child => ({
              rowType: child.RowType,
              title: child.Title,
              cells: Array.isArray(child.Cells) ? child.Cells.map(cell => cell.Value) : [],
            }))
          : [],
      }))
    : []
  const summaryText = rows
    .filter(row => row.title || row.cells.length)
    .slice(0, 12)
    .map(row => [row.title || row.rowType, ...row.cells].filter(Boolean).join(' | '))
    .join('\n')
  return {
    report: report
      ? {
          title: report.ReportTitles?.join(' - ') || report.ReportName,
          dateRange: { date: input.date || null },
          updatedDateUtc: report.UpdatedDateUTC,
          rows,
          summaryText,
        }
      : null,
    query: Object.fromEntries(params.entries()),
  }
}
