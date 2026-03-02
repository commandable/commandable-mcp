# Google Sheets

**10 tools**

![Google Sheets tests](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/theomccabe/771bd329f303087690c522afa1baa6f3/raw/test-google-sheet.json)

## Credential variants

| Variant | Label |
|---|---|
| `service_account` | Service Account (recommended) _(default)_ |
| `oauth_token` | OAuth Access Token (short-lived) |

## Tools

| Tool | Scope | Description |
|---|---|---|
| `get_spreadsheet` | read | Retrieve spreadsheet metadata including all sheet names, IDs, and properties. Set include… |
| `read_sheet` | read | Read cell values from a sheet range and return as a Markdown table with A1 column headers… |
| `create_spreadsheet` | write | Create a new Google Spreadsheet. Accepts a full spreadsheet resource body, allowing you t… |
| `update_values` | write | Write values to a specific A1 range, replacing existing content. Use valueInputOption='US… |
| `append_values` | write | Append rows of values after the last row of existing data in a range. Useful for adding n… |
| `batch_update_values` | write | Write values to multiple A1 ranges in a single API call. More efficient than calling upda… |
| `clear_values` | write | Clear all values (but not formatting) in the specified A1 range. The cells remain but the… |
| `batch_clear_values` | write | Clear values from multiple A1 ranges in a single API call. More efficient than calling cl… |
| `batch_update` | write | Send a spreadsheets.batchUpdate request for structural changes such as addSheet, deleteSh… |
| `copy_to_spreadsheet` | write | Copy a specific sheet (tab) from one spreadsheet to another. Provide the source spreadshe… |
