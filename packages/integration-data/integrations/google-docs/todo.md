## Future: Native markdown export via Drive API

Google Drive `files.export` now supports `text/markdown` as an export MIME type for Google Docs (added July 2024). This could replace the custom Docs API -> markdown conversion in `read_document` with a single API call:

```
GET https://www.googleapis.com/drive/v3/files/{fileId}/export?mimeType=text/markdown
```

### Why we're not using it yet

- The `google-docs` integration's base URL points to `docs.googleapis.com/v1`, not the Drive API. Calling Drive export would require either a proxy enhancement to allow cross-API calls or hardcoding the Drive URL in the handler.
- The custom conversion (ported from taylorwilsdon's approach) keeps the integration self-contained within the Docs API.

### When to revisit

- If we add cross-provider fetch support to the proxy/handler runtime.
- If the custom markdown conversion proves unreliable or hard to maintain.
- The Drive export requires `drive.readonly` scope (already included in the docs credential config).
