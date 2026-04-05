Use this integration for SharePoint document libraries and files.

Recommended workflow:

1. If you know the SharePoint hostname and path, start with `get_site_by_path`.
2. Otherwise use `search_sites` to discover the correct site.
3. Use `list_site_drives` to find the relevant document library for that site.
4. Use `list_drive_children` for deterministic folder browsing or `search_files` for broader file discovery.
5. Use `get_drive_item` when you need compact metadata for a specific file or folder.
6. Use `read_file_content` to consume the actual contents of a file in agent-friendly text.

Notes:

- `search_files` uses Microsoft Graph search. The `query` field accepts normal keywords and Graph KQL syntax.
- `siteId` and `driveId` filters on `search_files` are applied to the flattened search results after Graph returns them.
- `read_file_content` is for files only. Folders do not have readable file content.
- This v1 integration is intentionally focused on SharePoint sites, document libraries, folders, and files. It does not include classic SharePoint list/list-item tools or file upload.
