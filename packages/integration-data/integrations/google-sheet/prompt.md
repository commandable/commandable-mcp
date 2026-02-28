## A1 notation

Ranges use A1 notation: `SheetName!StartCell:EndCell`

Examples:
- `Sheet1!A1:D10` — cells A1 to D10 on Sheet1
- `Sheet1!A:A` — entire column A
- `Sheet1!1:5` — rows 1 through 5
- `Sheet1` — entire sheet (all data)
- `A1:D10` — if the spreadsheet has only one sheet, sheet name can be omitted
- `'My Sheet'!A1:B5` — sheet names with spaces must be quoted with single quotes

Use `get_spreadsheet` with `fields='sheets.properties'` first to discover all sheet names and their IDs.

## valueInputOption

Controls how input values are interpreted in `update_values`, `append_values`, and `batch_update_values`:

- `USER_ENTERED` *(recommended)* — values are parsed as if a user typed them. Supports formulas (`=SUM(A1:A10)`), dates (`1/15/2024`), currency (`$1,234.56`), and percentages (`50%`)
- `RAW` — values are stored as literal strings, no parsing. Use when you want exact string storage

## valueRenderOption

Controls how values are returned in `read_sheet`:

- `FORMATTED_VALUE` *(default)* — returns values as displayed in the UI (e.g. `"$1,234.56"`, `"50%"`)
- `UNFORMATTED_VALUE` — returns raw numbers (e.g. `1234.56`, `0.5`)
- `FORMULA` — returns formulas as strings (e.g. `"=SUM(A1:A10)"`)

## Recommended workflow

1. Call `get_spreadsheet` with `fields='sheets.properties'` to get sheet names and sheetIds
2. Use `read_sheet` with an A1 range to read data as markdown plus explicit row/column coordinates
3. Use the coordinates from `read_sheet` output (e.g. `B3`) with `update_values` or `append_values` for writes

## Structural changes

For adding/removing sheets, inserting/deleting rows or columns, or formatting cells, use `batch_update` with the appropriate request types:
- `addSheet` — add a new tab
- `deleteSheet` — remove a tab (requires sheetId, not name)
- `insertDimension` — insert rows or columns
- `deleteDimension` — delete rows or columns
- `repeatCell` — apply formatting to a range

## Large spreadsheets

Avoid calling `get_spreadsheet` with `includeGridData=true` on large spreadsheets -- it can return megabytes of data. Instead:
- Use `read_sheet` with specific ranges
- Use `get_spreadsheet` with `fields='sheets.properties'` to get sheet metadata only
