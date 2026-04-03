async (input) => {
  const toColumnName = (index) => {
    let n = index + 1
    let out = ''
    while (n > 0) {
      const rem = (n - 1) % 26
      out = String.fromCharCode(65 + rem) + out
      n = Math.floor((n - 1) / 26)
    }
    return out
  }

  const columnNameToIndex = (name) => {
    let value = 0
    for (const ch of name.toUpperCase()) {
      const code = ch.charCodeAt(0)
      if (code < 65 || code > 90) continue
      value = value * 26 + (code - 64)
    }
    return Math.max(0, value - 1)
  }

  const parseResolvedRange = (resolvedRange) => {
    // Examples: "Sheet1!A1:D5", "Sheet1!B:B", "Sheet1!2:9"
    const a1 = String(resolvedRange || '').split('!')[1] || ''
    const [start = 'A1'] = a1.split(':')
    const letters = (start.match(/[A-Za-z]+/) || ['A'])[0]
    const rowDigits = (start.match(/\d+/) || ['1'])[0]
    return {
      startColumn: columnNameToIndex(letters),
      startRow: Math.max(1, parseInt(rowDigits, 10) || 1),
    }
  }

  const escapeCell = (value) =>
    String(value ?? '')
      .replace(/\|/g, '\\|')
      .replace(/\r?\n/g, '<br>')

  const spreadsheetId = input.spreadsheetId
  const range = input.range || 'A1:Z1000'
  const params = new URLSearchParams()
  if (input.valueRenderOption) params.set('valueRenderOption', input.valueRenderOption)

  const qs = params.toString()
  const path = `/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}${qs ? `?${qs}` : ''}`
  const res = await integration.fetch(path)
  const payload = await res.json()

  const values = Array.isArray(payload?.values) ? payload.values : []
  const resolvedRange = payload?.range || range
  const { startColumn, startRow } = parseResolvedRange(resolvedRange)

  const width = Math.max(1, ...values.map((row) => (Array.isArray(row) ? row.length : 0)))
  const headerCells = Array.from({ length: width }, (_, i) => toColumnName(startColumn + i))
  const lines = [
    `|   | ${headerCells.join(' | ')} |`,
    `|---|${Array(width).fill('---').join('|')}|`,
  ]

  for (let i = 0; i < values.length; i += 1) {
    const row = Array.isArray(values[i]) ? values[i] : []
    const padded = [...row, ...Array(width - row.length).fill('')]
    const escaped = padded.map((cell) => escapeCell(cell))
    lines.push(`| ${startRow + i} | ${escaped.join(' | ')} |`)
  }

  return {
    spreadsheetId,
    range: resolvedRange,
    rowCount: values.length,
    columnCount: width,
    markdown: lines.join('\n'),
  }
}
