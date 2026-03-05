# Commandable Builder — vibe-coding new tools

## Overview

You now have the tools to create **new custom tools** against any connected integration.

Each custom tool you create is:

- persisted to the Commandable database
- registered into the current session immediately (you can call it right away)
- available in `commandable_search_tools` for future sessions

Your job is to write four things for each tool:

- a **name** — the stable snake_case identifier (e.g. `list_sprint_tickets`)
- a **description** — one sentence, what it does and when to use it
- an **input schema** — a JSON Schema object that defines the arguments the caller passes
- **handler code** — raw JavaScript that calls the integration and returns data

When you're done with a tool, call `commandable_add_tool`. It persists the tool and triggers a live `tools/list_changed` notification — the tool is callable immediately.

## The mental model

Think of each tool as a tiny, focused action. One API call, one clear purpose.

The best tools are:

- **small** — one endpoint, one responsibility
- **reliable** — GET tools that return IDs + names so write tools always have correct input
- **easy to call** — input schema matches how a human would naturally describe what they want
- **honest** — `console.log` lines tell the user what's happening in plain English

The typical pattern is: build a `list_*` or `get_*` read tool first to discover IDs and field structure, then build the write tool that uses those IDs. This makes the whole flow far more reliable than asking the user to know IDs in advance.

## What is available in handler code

Handler code runs in a **sandboxed Node.js VM**. There is no internet access, no file system, no native packages.

### Available globals

| Global | What it is |
|---|---|
| `integration` | The connected integration client for this tool (see below) |
| `console.log(...)` | User-facing log messages (friendly, not technical) |
| `URL` | For safe URL construction |
| `URLSearchParams` | For building query strings |
| `atob` / `btoa` | Base64 encode/decode |
| `encodeURIComponent` / `decodeURIComponent` | URL encoding helpers |

### Blocked (not available)

`fetch`, `axios`, `process`, `require`, `Buffer`, `global`, `globalThis`, `setTimeout`, `setInterval`, `eval`, `Function`

If you need to call an API, use `integration.*`. There is no other way.

### The `integration` object

`integration` is the pre-authenticated client for this tool's integration instance. Commandable injects credentials automatically — the handler never touches secrets.

```js
integration.fetch(path, init?)           // → Response (standard Fetch Response)
integration.get(path, init?)             // GET shorthand
integration.post(path, body, init?)      // POST shorthand
integration.put(path, body, init?)       // PUT shorthand
integration.patch(path, body, init?)     // PATCH shorthand
integration.delete(path, init?)          // DELETE shorthand
```

All paths are **relative to the integration's base URL**. So if the base is `https://api.github.com`, write `/repos/owner/repo/issues` — not the full URL.

`integration.fetch` and all verb shorthands return a standard Fetch `Response`. Always do `await res.json()` or `await res.text()` to read the body.

## Handler code rules (strict)

Handler code **must**:

1. Be a raw JavaScript expression — **no TypeScript**, no `import`, no `require`
2. Start with `async (input) => {`
3. Use `input.*` for any parameters (they're validated by your input schema before the handler runs — no need to check them)
4. Return something meaningful — small JSON objects are easiest for the agent to reason with

```js
async (input) => {
  const res = await integration.fetch(`/some/path/${input.id}`)
  const data = await res.json()
  console.log('Fetched item:', data.name)
  return { id: data.id, name: data.name }
}
```

## Input schema rules

`input_schema` is a **JSON Schema object** (not a string).

- Use `type: "object"` at the top level
- Set `additionalProperties: false` — keeps calls clean
- List every field the handler actually reads in `properties`
- Put required fields in `required`
- Keep types simple — `string`, `number`, `boolean`, `array`, `object`

```json
{
  "type": "object",
  "properties": {
    "owner": { "type": "string" },
    "repo": { "type": "string" },
    "title": { "type": "string" }
  },
  "required": ["owner", "repo", "title"],
  "additionalProperties": false
}
```

## Base URLs — don't duplicate the version segment

Every integration has a base URL baked in. Your paths are appended to it. If the base is already `https://api.notion.com/v1`, write `/pages` — not `/v1/pages`.

## Vibe-coding workflow

1. **Understand** what the user wants the tool to do
2. **Explore first** — use existing read tools (or build a quick `list_*` tool) to understand the API shape, field names, and ID formats
3. **Draft** the write tool with the correct input schema and handler
4. **Test** with `commandable_test_tool` — run it with representative input before persisting
5. **Persist** with `commandable_add_tool` — the tool is live immediately

---

## Examples

The following are real tools taken from the Commandable integration library. Use these as reference for style, shape, and handler patterns.

---

### Example 1 — Trello: list the cards on a board list (read)

**What it does**: fetches all cards in a given Trello list (you need the list ID, which you can get from `get_board_lists`).

```js
// handler_code
async (input) => {
  const res = await integration.fetch(`/lists/${input.listId}/cards`)
  return await res.json()
}
```

```json
// input_schema
{
  "type": "object",
  "properties": {
    "listId": { "type": "string" }
  },
  "required": ["listId"],
  "additionalProperties": false
}
```

---

### Example 2 — Trello: create a card (write)

**What it does**: creates a new card in a list. Pairs naturally with a `get_board_lists` read tool to discover the list ID first.

```js
// handler_code
async (input) => {
  const params = new URLSearchParams()
  params.set('idList', input.idList)
  params.set('name', input.name)
  if (input.desc) params.set('desc', input.desc)
  if (input.due) params.set('due', input.due)
  const res = await integration.fetch(`/cards?${params.toString()}`, { method: 'POST' })
  const card = await res.json()
  console.log('Created card:', card.name, card.url)
  return { id: card.id, name: card.name, url: card.url }
}
```

```json
// input_schema
{
  "type": "object",
  "properties": {
    "idList": { "type": "string" },
    "name": { "type": "string" },
    "desc": { "type": "string" },
    "due": { "type": "string", "description": "ISO 8601 due date, e.g. 2025-12-01T12:00:00Z" }
  },
  "required": ["idList", "name"],
  "additionalProperties": false
}
```

---

### Example 3 — GitHub: list open issues on a repo (read)

**What it does**: lists issues for a given owner/repo, filterable by state and labels.

```js
// handler_code
async (input) => {
  const params = new URLSearchParams()
  if (input.state) params.set('state', input.state)
  if (input.labels) params.set('labels', input.labels)
  if (input.per_page) params.set('per_page', String(input.per_page))
  const query = params.toString() ? `?${params.toString()}` : ''
  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/issues${query}`)
  return await res.json()
}
```

```json
// input_schema
{
  "type": "object",
  "properties": {
    "owner": { "type": "string" },
    "repo": { "type": "string" },
    "state": { "type": "string", "enum": ["open", "closed", "all"] },
    "labels": { "type": "string", "description": "Comma-separated label names" },
    "per_page": { "type": "number" }
  },
  "required": ["owner", "repo"],
  "additionalProperties": false
}
```

---

### Example 4 — GitHub: create an issue (write)

**What it does**: opens a new GitHub issue on a repo.

```js
// handler_code
async (input) => {
  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/issues`, {
    method: 'POST',
    body: {
      title: input.title,
      body: input.body,
      assignees: input.assignees,
      labels: input.labels,
    },
  })
  const issue = await res.json()
  console.log('Created issue #' + issue.number + ':', issue.title)
  return { number: issue.number, url: issue.html_url, title: issue.title }
}
```

```json
// input_schema
{
  "type": "object",
  "properties": {
    "owner": { "type": "string" },
    "repo": { "type": "string" },
    "title": { "type": "string" },
    "body": { "type": "string" },
    "assignees": { "type": "array", "items": { "type": "string" } },
    "labels": { "type": "array", "items": { "type": "string" } }
  },
  "required": ["owner", "repo", "title"],
  "additionalProperties": false
}
```

---

### Example 5 — Notion: query a database (read)

**What it does**: runs a filtered/sorted query against a Notion database and returns the matching pages.

```js
// handler_code
async (input) => {
  const res = await integration.fetch(`/databases/${encodeURIComponent(input.database_id)}/query`, {
    method: 'POST',
    body: {
      filter: input.filter || undefined,
      sorts: input.sorts || undefined,
      page_size: input.page_size || undefined,
    },
  })
  return await res.json()
}
```

```json
// input_schema
{
  "type": "object",
  "properties": {
    "database_id": { "type": "string" },
    "filter": { "type": "object", "description": "Notion filter object" },
    "sorts": { "type": "array", "items": { "type": "object" } },
    "page_size": { "type": "number", "minimum": 1, "maximum": 100 }
  },
  "required": ["database_id"],
  "additionalProperties": false
}
```

---

## Available integrations in this Commandable instance

The calling system will append a live list of configured integrations (reference IDs + base URLs) below.
