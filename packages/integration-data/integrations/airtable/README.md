# Airtable

**11 tools**

![Airtable tests](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/theomccabe/771bd329f303087690c522afa1baa6f3/raw/test-airtable.json)

## Credential variants

| Variant | Label |
|---|---|
| `personal_access_token` | Personal Access Token _(default)_ |

## Tools

| Tool | Scope | Description |
|---|---|---|
| `list_bases` | read | List bases available to the authenticated user. |
| `list_tables` | read | List tables in a base (metadata). |
| `get_table_schema` | read | Fetch a table's schema (fields, views) by tableId via metadata. |
| `list_table_fields` | read | List fields for a table (metadata). |
| `list_views` | read | List views for a table (metadata). |
| `list_records` | read | List records from a table with optional filters (compact summaries; use `get_record` for full fields). |
| `get_record` | read | Fetch a single record by recordId. |
| `search_records` | read | Search records in a table using a field and value (compact summaries; use `get_record` for full fields). |
| `create_record` | write | Create a record in a table. |
| `update_record` | write | Update a record in a table. |
| `delete_record` | write | Delete a record from a table. |
