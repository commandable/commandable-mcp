## File and folder IDs

Drive file and folder IDs appear in the URL:
- Files: `https://drive.google.com/file/d/{fileId}/view`
- Folders: `https://drive.google.com/drive/folders/{folderId}`
- Google Docs: `https://docs.google.com/document/d/{documentId}/edit`

Use `search_files` or `list_files` to find IDs programmatically.

## MIME types for Google Workspace files

When creating files with `create_file`, use these MIME types:

| File type | MIME type |
|---|---|
| Google Doc | `application/vnd.google-apps.document` |
| Google Sheet | `application/vnd.google-apps.spreadsheet` |
| Google Slides | `application/vnd.google-apps.presentation` |
| Google Forms | `application/vnd.google-apps.form` |
| Google Folder | `application/vnd.google-apps.folder` |

## Drive search query syntax

The `query` parameter in `search_files` uses the Drive search syntax:

- `name contains 'budget'` — file name contains string
- `name = 'exact name'` — exact file name match
- `mimeType = 'application/pdf'` — filter by MIME type
- `mimeType != 'application/vnd.google-apps.folder'` — exclude folders
- `'folderId' in parents` — files in a specific folder
- `modifiedTime > '2024-01-01T00:00:00'` — modified after date (RFC3339)
- `trashed = true` — only trashed files
- `starred = true` — only starred files
- `sharedWithMe = true` — files shared with the user

Combine with `and`, `or`, `not`: `name contains 'report' and mimeType = 'application/pdf' and modifiedTime > '2024-01-01T00:00:00'`

## Reading file contents

1. Use `search_files` or `list_files` to find the file (note its `id` and `mimeType`)
2. Call `read_file_content` with `fileId` and `mimeType`
   - Google Docs export to Markdown natively
   - Other Google Workspace files use the best available export, then fall back to the extraction side process when the export is binary
   - Uploaded PDF, DOCX, XLSX, PPTX, CSV, JSON, HTML, and text files are downloaded and converted automatically when needed

## Export formats

Google Workspace files must be exported (they have no binary content):

| Source | Default export | Alternative exports |
|---|---|---|
| Google Docs | `text/markdown` | `text/plain`, `text/html`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `application/pdf` |
| Google Sheets | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | `text/csv`, `application/pdf` |
| Google Slides | `application/vnd.openxmlformats-officedocument.presentationml.presentation` | `text/plain`, `application/pdf` |

## Sharing files

- Individual user: `share_file` with `type='user'`, `role='writer'`, `emailAddress='user@example.com'`
- Anyone with link: `share_file` with `type='anyone'`, `role='reader'`
- Whole domain: `share_file` with `type='domain'`, `role='reader'`, `domain='example.com'`
