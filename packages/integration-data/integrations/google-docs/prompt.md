## Reading documents

Use `get_document_text` for plain text extraction -- it handles the nested Docs API structure automatically and returns `{documentId, text}`.

Use `get_document_structured` when you need the body content with formatting information (paragraph styles, text runs, tables). Returns the `body.content` array.

Use `get_document` only when you need the full raw API resource including inline objects, named ranges, and document-level styles.

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
