## Task

Write a new integration-data folder for `<INTEGRATION_NAME>`.

## Required structure

Create `commandable-mcp/packages/integration-data/integrations/<name>/` containing:

- `manifest.json`: flat `tools[]`; each tool has `name`, `description`, `inputSchema` (relative path), `handler` (relative path), `scope` (`read` | `write` | optionally `admin`). If the integration has genuinely independent workflow areas, add a top-level `toolsets` map and a `toolset` field on each tool (see **Toolsets** section below).
- `schemas/*.json`: JSON Schema for each tool input. Prefer `additionalProperties: false` for strict contracts; use `true` only for pass-through bodies (common in Google APIs). Reuse `empty.json` for no-arg tools.
- `handlers/*.js`: async arrow functions `async (input) => { ... }` using `integration.fetch(path, init?)` for all HTTP calls. Pass `body` as a plain object (proxy will JSON-stringify). Return parsed JSON.
- `credentials.json`: `{ schema, injection }` where `schema` is JSON Schema for secrets and `injection` is `headers` and/or `query` templates using `{{placeholder}}`
- `credentials_hint.md`: **numbered steps** (1., 2., 3., …) telling a user exactly how to obtain/provide credentials
- `prompt.md` (optional): extra LLM guidance only if the API has non-obvious usage patterns

Also register the provider in `src/integrations/providerRegistry.ts` with its base URL and auth factory.

## Tool design goals

- **Default**: small, composable tools that mirror API resources.
- **Read tools**: side-effect free (GET only).
- **Write tools**: POST/PUT/PATCH/DELETE where appropriate.
- **Coverage**: start with core CRUD + list/search + get-by-id; add convenience tools after.

## When to go beyond REST proxying

Most handlers should be thin proxies (fetch → return JSON). Only add multi-step/orchestrating handlers when the raw API is genuinely hard for an LLM to use correctly, e.g.:

- multi-step workflows (GitHub tree → blob → commit → ref)
- required transforms (e.g. base64 encoding) that the caller shouldn’t manage
- awkward addressing that benefits from higher-level helpers (“find text then act” patterns like Docs/Slides)

If an endpoint is already clean and self-contained, just proxy it.

## Reference examples (follow exactly)

- `github/`: simple proxies + complex orchestration (`create_commit.js`)
- `notion/`: clean proxying + optional `prompt.md`
- `google-calendar/`: query param building + `read`/`write`/`admin` scopes
- `trello/`: query-param credential injection + `displayCards`
- `google-docs/`, `google-slides/`: higher-level write helpers over batchUpdate APIs



IMPORTANT: Think through how an AI agent might use an integration and any tweaks to the rest api that might be needed to support actual agentic use cases

---

## Lessons from GSuite: what we changed and why

We overhauled all six Google integrations (Gmail, Drive, Calendar, Docs, Sheets, Slides) after benchmarking against taylorwilsdon's [google_workspace_mcp](https://github.com/taylorwilsdon/google_workspace_mcp) and reviewing MCP agent-consumption best practices. The principles below should guide every new integration.

### 1. `read_*` tools should return agent-friendly content, not raw API JSON

Raw API responses (nested JSON, base64-encoded bodies, massive resource trees) waste context tokens and force agents to write parsing logic they hallucinate. Instead:

- **Docs**: `read_document` converts the Docs API body into clean Markdown (headings, bold/italic/strikethrough, links, code spans, lists with nesting, tables). Falls back to plain text if conversion fails.
- **Sheets**: `read_sheet` returns a Markdown table with A1 column headers (A, B, C…) and row numbers, so the agent can immediately construct cell references like `B3` for writes.
- **Slides**: `read_presentation` extracts text from every slide's shapes and returns a human-readable summary with slide IDs, rather than the raw presentation resource.
- **Gmail**: `read_email` decodes base64 body parts and flattens headers into `{ subject, from, to, date, body }` instead of returning the nested payload tree.

**Pattern**: if the API returns structured data meant for programmatic consumption, build a `read_*` tool that converts it into the simplest text format an LLM can understand (usually Markdown). Reserve `get_*` tools for metadata that enables further API calls (e.g. `get_spreadsheet` for sheet names/IDs).

### 1b. Downloadable files and attachments should use `utils.extractFileContent()`

If an API exposes downloadable files or attachments, prefer a high-level `read_*` or `extract_*` tool that:

1. Discovers the file or attachment through normal API calls
2. Calls `utils.extractFileContent(...)`
3. Returns extracted text plus small metadata

Use the utility like this:

```js
await utils.extractFileContent({
  auth: false,
  source: item.downloadUrl,
})

await utils.extractFileContent({
  auth: true,
  source: `/files/${fileId}?alt=media`,
})
```

Rules:

- `auth: false` is for public or pre-signed absolute URLs
- `auth: true` is for downloads that should use an existing integration's auth
- when `auth: true`, `source` may be relative or absolute
- do not use this utility for native structured resources like Google Docs, Sheets, or Slides; use their native APIs or export endpoints instead
- do not return raw binary or base64 blobs to the agent unless the tool is explicitly a download tool

### 2. Delete tools that agents cannot realistically use

We deleted 14 tools that were either too programmatic, too verbose, or redundant:

- **DataFilter-based tools** (Sheets): `get_spreadsheet_by_data_filter`, `get_values_by_data_filter`, `batch_update_values_by_data_filter`, `batch_clear_values_by_data_filter` -- DataFilter objects are structured JSON that agents cannot construct reliably.
- **Developer metadata tools** (Sheets): `search_developer_metadata`, `get_developer_metadata` -- niche API that no agent workflow needs.
- **Raw RFC822 tools** (Gmail): `send_message`, `create_draft` -- require manual MIME construction and base64url encoding. Replaced by `send_email` and `create_draft_email` which accept flat fields (to, subject, body).
- **Redundant update tools** (Calendar): `update_event` (full PUT replace) removed in favour of `patch_event` (partial update), which is safer and more intuitive.
- **Raw read tools** (Docs): `get_document`, `get_document_structured`, `get_document_text` all replaced by the single `read_document` markdown tool.
- **Raw value tools** (Sheets): `get_values`, `batch_get_values` replaced by `read_sheet`.

**Pattern**: if a tool requires the agent to construct complex structured input (MIME encoding, DataFilter objects, GridRange specs), either abstract it away with a high-level tool or delete it. If multiple tools serve the same purpose at different abstraction levels, keep only the one agents can use.

### 3. Naming convention: `read_*` vs `get_*`

- **`read_*`** tools return content in agent-friendly format (Markdown, extracted text). These are the primary tools agents should use for consuming content.
- **`get_*`** tools return API metadata/resources for further programmatic calls (e.g. `get_spreadsheet` for sheet names/IDs, `get_file` for file metadata).

This naming tells the agent which tool to reach for when it wants to understand content vs when it needs IDs/metadata for a follow-up call.

### 4. Encode domain knowledge in Markdown table output (Sheets example)

For Sheets, the `read_sheet` tool returns a Markdown table with A1 column letters as headers and row numbers as the first column:

```
|   | A       | B       | C    |
|---|---------|---------|------|
| 1 | Name    | Revenue | Cost |
| 2 | Widget  | 1500    | 800  |
```

This means the agent sees "Widget's revenue is in B2" and can directly call `update_values` with range `Sheet1!B2`. The content and the addressing metadata are unified in a single output -- no need for a separate metadata call.

### 5. Abstract away encoding/transport complexity

The #1 anti-pattern in MCP tool design is exposing encoding details to the agent. Examples we fixed:

- **Gmail send/draft**: agents were expected to construct RFC822 MIME messages and base64url-encode them. Now `send_email` and `create_draft_email` accept flat fields and handle encoding internally.
- **Docs markdown**: agents were getting raw `body.content` JSON arrays. Now `read_document` walks the document tree and produces Markdown.

**Pattern**: if the API requires a transform (base64, MIME, URL encoding, JSON tree walking), do it in the handler. The agent should only deal with human-readable strings and simple key-value inputs.

#### Sandbox globals: use `btoa`/`atob`, not `Buffer`

Handlers run inside a locked-down VM sandbox. `Buffer` is explicitly set to `undefined` in the context — using it will throw `Cannot read properties of undefined (reading 'from')` at runtime. Use the Web-standard equivalents instead:

- **Encoding to base64url** (e.g. RFC822 MIME for Gmail):
  ```js
  const raw = btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  ```
- **Decoding base64url to UTF-8** (e.g. Gmail message body parts):
  ```js
  const text = decodeURIComponent(escape(atob(data.replace(/-/g, '+').replace(/_/g, '/'))))
  ```

`btoa`/`atob`, `URL`, `URLSearchParams`, `encodeURIComponent`, `decodeURIComponent`, `unescape`, and `escape` are all available in the sandbox. `Buffer`, `process`, `require`, `fetch`, `eval`, `Function`, `setTimeout`, and `global` are not.

### 6. Rich tool descriptions are critical

Every tool description should include: what it does, when to use it (vs alternatives), key parameter hints, and cross-references to related tools. Examples:

- `read_sheet`: "...the coordinates in the output can be used directly with update_values and append_values for writes. Use get_spreadsheet first to discover sheet names."
- `send_email`: "...For replies, provide replyToMessageId and threadId to keep the reply in the same conversation thread."
- `patch_event`: "...Use this as the standard event update method."

### 7. `prompt.md` files should document non-obvious API patterns

Each integration's `prompt.md` should cover workflow guidance agents need but can't infer from tool descriptions alone:

- Gmail: search query syntax (`is:unread`, `from:`, `has:attachment`), threading pattern, system label IDs
- Calendar: RFC3339 format, `singleEvents=true` + `orderBy=startTime`, all-day vs timed events
- Sheets: A1 notation reference, `valueInputOption` (`USER_ENTERED` vs `RAW`), recommended read-then-write workflow
- Docs: index-based editing abstracted by first-match tools, marker pattern explanation
- Slides: EMU units, slide addressing (0-based index vs objectId), predefined layouts

### 8. Toolsets: grouping tools for LLM focus

Toolsets let users selectively enable subsets of an integration's tools so the LLM isn't drowned in irrelevant tool definitions. They reduce context-window pollution and improve tool selection accuracy.

**When to use toolsets (multi-toolset)**

Only add toolsets when the integration covers **genuinely independent agent workflows** -- work areas where an agent would realistically want one subset and NOT the others. The test: "would an agent doing task A ever need the tools from group B?" If the answer is usually yes, they belong in the same toolset.

Good splits (independent workflows):
- **GitHub**: Code & Files, Issues, Pull Requests, CI, Releases, Repository Management -- a PR reviewer doesn't need release tools.
- **Gmail**: Email (search + read + compose) vs Organize (label, archive, trash, delete) -- reading and replying is one workflow; inbox triage is another.
- **Calendar**: Events (the core scheduling workflow) vs Sharing (ACL/permission management most agents never touch).
- **Notion**: Pages (content, blocks, comments, users) vs Databases (query, create, update databases) -- distinct Notion concepts.

**When NOT to use toolsets (single toolset = omit entirely)**

If the integration is a single-purpose app where all tools serve one workflow, don't add `toolsets` at all. Tools without a `toolset` field always load, so omitting is clean and zero-ceremony.

Examples that are correctly single-toolset:
- **Google Docs** (12 tools): "edit a document" is one job. Splitting reading from editing or text from styling is splitting by code structure, not by user intent.
- **Google Sheets** (10 tools): "work with spreadsheet data" is one job.
- **Google Slides** (11 tools): "edit a presentation" is one job.
- **Google Drive** (9 tools): small integration, all file operations.
- **Trello** (34 tools): you can't work with cards without board context. It's one workflow.
- **Airtable** (11 tools): schema discovery and record operations are one workflow.

**Don't duplicate `scope`**

`scope` (read/write/admin) already controls access levels. If the only meaningful split is read vs write, that's handled. Toolsets are about **what domain you're working in**, not what permission level you have.

**Manifest structure** when toolsets are used:

```json
{
  "toolsets": {
    "events": {
      "label": "Events",
      "description": "Browse, schedule, and manage calendar events"
    },
    "sharing": {
      "label": "Sharing",
      "description": "Control who can access calendars"
    }
  },
  "tools": [
    { "name": "list_events", ..., "toolset": "events" },
    { "name": "list_acl", ..., "toolset": "sharing" }
  ]
}
```

Each toolset key must be `snake_case`. Every tool must reference a key that exists in `toolsets`. The `label` is a short human-readable name; `description` is one sentence explaining what the toolset covers.

### 9. Reference implementation comparison

When building a new integration, check if an established open-source MCP server already exists for that API. Compare:
- Which tools do they include vs exclude?
- How do they format output for agent consumption?
- Do they have any abstraction patterns we should adopt?

taylorwilsdon's `google_workspace_mcp` was our reference. Key differences we adopted:
- Markdown content extraction (Docs, Slides)
- Flat-field email tools instead of raw MIME
- A1-annotated sheet output
- Removal of overly-programmatic tools (DataFilter, developer metadata)
- Text extraction from presentation slides instead of raw JSON

### 10. Escape hatches and plain-text fallbacks

Complex conversion logic (like Docs-to-Markdown) can fail on edge cases. Always include a fallback path. Our `read_document` handler attempts full Markdown conversion but falls back to plain-text extraction if the result is empty. This ensures the agent always gets something useful.

### 11. Future: native API format exports

Google Drive's `files.export` API now supports `text/markdown` as an export MIME type for Docs. We currently use custom Docs API -> Markdown conversion to keep the integration self-contained (no cross-API dependency on Drive scopes). A `todo.md` in `google-docs/` tracks this for future investigation when we add cross-provider fetch support.



Important hint - when researching a new integration - it can be really useful to read existing MCP servers for that integration. they may be open source and freely avaialable. This should give you an idea of the right kind of abstractions to use and tools to provide.