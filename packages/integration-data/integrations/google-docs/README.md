# Google Docs

**13 tools**

![Google Docs tests](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/theomccabe/771bd329f303087690c522afa1baa6f3/raw/test-google-docs.json)

## Credential variants

| Variant | Label |
|---|---|
| `service_account` | Service Account (recommended) _(default)_ |
| `oauth_token` | OAuth Access Token (short-lived) |

## Tools

| Tool | Scope | Description |
|---|---|---|
| `read_document` | read | Read a Google Doc and return its content as clean Markdown. Preserves headings, bold, ita… |
| `create_document` | write | Create a new empty Google Doc with the given title. Returns the created document's metada… |
| `batch_update` | write | Send a documents.batchUpdate request to modify a document with one or more structured req… |
| `append_text` | write | Append plain text to the end of a Google Doc. Automatically fetches the document to find … |
| `replace_all_text` | write | Replace all occurrences of a text string in a Google Doc with new text. Case-sensitive by… |
| `style_first_match` | write | Find the first occurrence of text in a document and apply a TextStyle to it (bold, italic… |
| `insert_text_after_first_match` | write | Find the first occurrence of text and insert new text immediately before or after it. Use… |
| `insert_table_after_first_match` | write | Find the first occurrence of text and insert a table with the specified number of rows an… |
| `insert_page_break_after_first_match` | write | Find the first occurrence of text and insert a page break nearby. Useful for structuring … |
| `insert_inline_image_after_first_match` | write | Find the first occurrence of text and insert an inline image nearby, referenced by URL. R… |
| `delete_first_match` | write | Find the first occurrence of text in the document and delete it. Only the first match is … |
| `update_paragraph_style_for_first_match` | write | Find the first occurrence of text and update the paragraph style for the paragraph contai… |
| `update_document_style` | write | Update document-level style properties such as page size (pageSize.width, pageSize.height… |
