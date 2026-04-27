async (input) => {
  const headers = input.tenantId ? { 'xero-tenant-id': input.tenantId } : {}
  const params = new URLSearchParams()
  if (input.fromDate) params.set('fromDate', input.fromDate)
  if (input.toDate) params.set('toDate', input.toDate)
  if (input.periods) params.set('periods', String(input.periods))
  if (input.timeframe) params.set('timeframe', input.timeframe)
  if (input.trackingCategoryId) params.set('trackingCategoryID', input.trackingCategoryId)
  if (input.trackingOptionId) params.set('trackingOptionID', input.trackingOptionId)
  if (input.standardLayout !== undefined) params.set('standardLayout', String(input.standardLayout))
  if (input.paymentsOnly !== undefined) params.set('paymentsOnly', String(input.paymentsOnly))
  const res = await integration.get(`/api.xro/2.0/Reports/ProfitAndLoss${params.toString() ? `?${params}` : ''}`, { headers })
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
  const headings = rows.find(row => row.rowType === 'Header')?.cells || []
  const summaryText = rows
    .filter(row => row.title || row.cells.length)
    .slice(0, 12)
    .map(row => [row.title || row.rowType, ...row.cells].filter(Boolean).join(' | '))
    .join('\n')
  return {
    report: report
      ? {
          title: report.ReportTitles?.join(' - ') || report.ReportName,
          dateRange: { fromDate: input.fromDate || null, toDate: input.toDate || null },
          updatedDateUtc: report.UpdatedDateUTC,
          headings,
          rows,
          summaryText,
        }
      : null,
    query: Object.fromEntries(params.entries()),
  }
}
