# Confluence usage guide

## Recommended workflow

1. Use `list_spaces` (or `search_pages`) to discover where content lives.
2. Use `search_pages` with CQL to find the right page ID(s).
3. Use `read_page` to get the content as Markdown.
4. For edits, use `update_page` (it automatically handles version increments).

## CQL (Confluence Query Language) quick reference

Common patterns for `search_pages.cql`:

- Restrict to a space:
  - `space = "ENG" AND type = page`
- Title match:
  - `title ~ "runbook" AND type = page`
- Full-text match:
  - `text ~ "oncall" AND type = page`
- Label match:
  - `label = "runbook" AND type = page`
- Combine filters:
  - `space = "ENG" AND type = page AND (title ~ "onboarding" OR text ~ "onboarding")`
- Sort:
  - `... ORDER BY lastmodified DESC`

Tips:
- Prefer small `limit` (e.g. 10) and paginate with `start`.
- Use labels as a stable way to group pages for later discovery.

## Confluence storage format (XHTML) basics

Write tools (`create_page`, `update_page`, `add_comment`) use **Confluence storage format** in `bodyStorage`.

For most agent use cases, simple HTML-like markup is enough:

- Headings: `<h1>Title</h1>`, `<h2>Section</h2>`
- Paragraphs: `<p>Text</p>`
- Lists: `<ul><li>Item</li></ul>`, `<ol><li>Item</li></ol>`
- Inline code: `<code>const x = 1</code>`
- Code blocks: `<pre><code>...</code></pre>`
- Links: `<a href="https://example.com">Example</a>`
- Tables (basic): `<table><tr><th>A</th></tr><tr><td>1</td></tr></table>`

Note: Confluence also supports rich macros like `<ac:structured-macro>...</ac:structured-macro>`. If you encounter macro-heavy pages, `read_page` will still extract useful text, but editing while preserving complex macro structure may require fetching the storage XHTML and updating carefully.

## Page hierarchy

- Spaces contain pages.
- Pages can be nested under a parent page (`parentId`).
- Use `get_page_children` to traverse a documentation tree (e.g. a handbook or runbook index).

