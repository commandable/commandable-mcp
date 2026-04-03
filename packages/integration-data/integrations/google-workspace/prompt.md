## IDs and URLs

Google Workspace resources use product-specific URLs:

- Drive files: `https://drive.google.com/file/d/{fileId}/view`
- Drive folders: `https://drive.google.com/drive/folders/{folderId}`
- Docs: `https://docs.google.com/document/d/{documentId}/edit`
- Sheets: `https://docs.google.com/spreadsheets/d/{spreadsheetId}/edit`
- Slides: `https://docs.google.com/presentation/d/{presentationId}/edit`

Use Drive search/list tools to discover files when the Drive toolset is enabled.

## When to use Drive vs native product tools

- Use Drive tools to search, list, move, share, create metadata-only files, and read arbitrary uploaded files.
- Use Docs tools when you need structured document editing or rich document reads.
- Use Sheets tools when you need sheet metadata, ranges, values, or structural spreadsheet updates.
- Use Slides tools when you need deck-level reads, thumbnails, or structured slide edits.
- Use `search_docs`, `search_sheets`, and `search_slides` when you want product-specific discovery without manually writing Drive MIME filters.

`read_file_content` is a good default for reading arbitrary files, but native Docs/Sheets/Slides tools are better when you need structure-preserving operations.

## Batch update tools

This merged integration has three product-specific batch update tools:

- `docs_batch_update`
- `sheets_batch_update`
- `slides_batch_update`

Use the one that matches the product you are editing.
