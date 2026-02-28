## Reading documents

Use `read_document` as the standard read tool. It returns clean markdown with headings, lists, links, inline code, and tables preserved as much as possible.

`read_document` includes an escape hatch: if markdown conversion fails to produce useful content, it falls back to plain-text extraction so you still get readable output.

For editing workflows, read with `read_document` first, then use `append_text`, `replace_all_text`, first-match tools, or `batch_update`.

## Editing documents

The Google Docs API uses character-index-based editing, but the high-level tools handle index resolution automatically:

- **`append_text`** — adds text to the end of the document (no index needed)
- **`replace_all_text`** — replaces every occurrence of a string (no index needed)
- **First-match tools** (`style_first_match`, `insert_text_after_first_match`, etc.) — locate text by content, then act on the first match

Only use `batch_update` with raw index operations when the higher-level tools don't cover your use case.

## First-match pattern

The `*_first_match` tools use a 3-step marker approach:
1. Replace all occurrences of `findText` with a unique marker (`__CMD_MARK_...`)
2. Fetch the document to find the marker's exact character indices
3. Apply the operation at those indices, then restore the original text

This means each first-match operation makes 3 API calls. They return `{applied: true}` on success or `{applied: false}` if the text was not found.

## Common batch_update operations

```json
{ "requests": [
  { "insertText": { "text": "Hello", "location": { "index": 1 } } },
  { "deleteContentRange": { "range": { "startIndex": 5, "endIndex": 10 } } },
  { "updateTextStyle": {
      "range": { "startIndex": 1, "endIndex": 6 },
      "textStyle": { "bold": true },
      "fields": "bold"
  }},
  { "updateParagraphStyle": {
      "range": { "startIndex": 1, "endIndex": 2 },
      "paragraphStyle": { "namedStyleType": "HEADING_1" },
      "fields": "namedStyleType"
  }}
]}
```

## Document IDs

The documentId appears in the Google Docs URL: `https://docs.google.com/document/d/{documentId}/edit`
