# Integration Data — Agent Guide

This package (`@commandable/integration-data`) is the canonical registry of prebuilt integration definitions: tool schemas, sandboxed handlers, credential configurations, and usage guides for agents.

It has **no runtime dependencies on the rest of the monorepo**. It is built, versioned, and published independently. Other packages (`@commandable/mcp-core`, `commandable-app-v1`) consume it as a library.

---

## How the package works end-to-end

### Source → build → registry

Everything in `integrations/` is source. Nothing is consumed directly at runtime.

The build step runs `scripts/generate-registry.mjs`, which walks every integration folder, reads `manifest.json`, resolves all file references (schemas, handlers, variant manifests, credentials), inlines the file contents, and writes a single generated TypeScript file:

```
src/generated/registry.ts   ← GENERATED — do not edit by hand
```

The published package exposes loader functions that read from this generated registry. Callers never touch the filesystem at runtime.

Build command:
```bash
yarn workspace @commandable/integration-data run generate:registry
# or as part of the full build:
yarn workspace @commandable/integration-data run build
```

Always regenerate and commit `registry.ts` when you change any integration file.

---

## Integration folder structure

Each integration lives at `integrations/<type>/`. The `<type>` string is the stable key used everywhere: in the database, in tool names, and as the registry lookup key.

```
integrations/
  sharepoint/
    manifest.json          ← required
    schemas/               ← required
      *.json
    handlers/              ← required
      *.js
    credentials.json       ← required (for credential-based auth)
    credentials_hint.md    ← required (numbered human setup steps)
    usage_guide.md         ← optional (agent usage guide; legacy `prompt.md` still read by codegen)
    variants/              ← optional (scoped variants of this integration)
      sharepoint-folder/
        manifest.json
```

---

## manifest.json

The manifest is the index of the integration. It declares tools and, optionally, toolsets and variants.

### Minimal structure

```json
{
  "name": "Display Name",
  "version": "0.1.0",
  "baseUrl": "https://api.example.com/v1",
  "tools": [
    {
      "name": "list_items",
      "description": "...",
      "inputSchema": "schemas/list_items.json",
      "handler": "handlers/list_items.js",
      "scope": "read"
    }
  ]
}
```

### Tool fields

| Field | Required | Notes |
|---|---|---|
| `name` | Yes | `snake_case`. Becomes part of the tool's MCP name. |
| `description` | Yes | LLM-visible. Be specific — include when to use it and what it returns. |
| `inputSchema` | Yes | Path to a JSON Schema file relative to the integration folder. |
| `handler` | Yes | Path to a JS handler file relative to the integration folder. |
| `scope` | Yes | `read`, `write`, or `admin`. Read tools must be side-effect free (GET only). |
| `toolset` | Optional | Key from the `toolsets` map. Only needed for multi-toolset integrations. |
| `credentialVariants` | Optional | Array of credential variant keys. When set, tool is only available for those variants. |
| `injectFromConfig` | Optional | Maps tool input fields to integration config keys. Used in variants. |

### `scope` values

- `read` — GET only, no side effects
- `write` — POST/PUT/PATCH/DELETE
- `admin` — Destructive or tenant-wide operations (delete account, transfer ownership, etc.)

Scope controls which tools load depending on the `maxScope` configured per integration instance.

### Toolsets

Toolsets let users load subsets of a large integration's tools. They are for **genuinely independent agent workflows** — groups where an agent doing task A typically does not need task B's tools.

When to use toolsets: GitHub (code vs issues vs PRs), Jira (issues vs boards), Gmail (compose vs organize).

When NOT to use: small single-purpose integrations (Trello, Airtable, Sheets). If all tools serve one workflow, omit `toolsets` entirely.

```json
{
  "toolsets": {
    "issues": {
      "label": "Issues",
      "description": "Search, read, create, and manage issues"
    },
    "boards": {
      "label": "Boards & Sprints",
      "description": "Work with boards, sprints, and backlogs"
    }
  },
  "tools": [
    { "name": "search_issues", ..., "toolset": "issues" },
    { "name": "list_boards",   ..., "toolset": "boards" }
  ]
}
```

Toolset keys must be `snake_case`. Every tool must reference a key that exists in the `toolsets` map.

### `utils` bundles

Some integrations need shared utility functions in the handler sandbox. Declare them at the top level of the manifest:

```json
{
  "utils": ["adf"],
  ...
}
```

Available bundles:

| Key | Provides |
|---|---|
| `html` | `utils.html.toMarkdown(html)`, `utils.html.toText(html)`, `utils.html.fromMarkdown(md)` |
| `adf` | `utils.adf.toMarkdown(adf)`, `utils.adf.toPlainText(adf)`, `utils.adf.fromText(str)`, `utils.adf.fromMarkdown(md)` |

Jira uses `"utils": ["adf"]` because its API returns and accepts Atlassian Document Format.

---

## schemas/*.json

JSON Schema files for each tool's input. Follow these conventions:

- `additionalProperties: false` for strict contracts (preferred)
- `additionalProperties: true` only for pass-through request bodies
- Reuse `schemas/empty.json` (`{ "type": "object", "properties": {}, "additionalProperties": false }`) for tools that take no input
- Field names should match the API's parameter names where possible

The schema the agent sees has `injectFromConfig` fields **stripped out** automatically by the registry generator (the agent should not supply values that are injected from config).

---

## handlers/*.js

Handlers are **async arrow functions** evaluated in a Node.js VM sandbox. They are stored as plain `.js` files and inlined into the generated registry as strings.

### Contract

```js
async (input) => {
  // input: validated against the tool's inputSchema
  // integration: bound by the runtime to the active integration instance
  // utils: sandbox utility functions (html, adf, extractFileContent)
  // returns: any JSON-serialisable value
}
```

### `integration` API

The `integration` object is bound at runtime by the host. It exposes:

```js
integration.fetch(path, init?)   // GET (returns Response)
integration.get(path, init?)     // GET shorthand
integration.post(path, body, init?)
integration.put(path, body, init?)
integration.patch(path, body, init?)
integration.delete(path, init?)
integration.referenceId          // stable user-defined label, e.g. "jira-primary"
integration.type                 // integration type key, e.g. "jira"
integration.label                // user-visible label
```

Paths are relative to the integration's `baseUrl`. Auth headers/query params are injected automatically by the proxy using the credential configuration.

### Sandbox globals

Available: `URL`, `URLSearchParams`, `encodeURIComponent`, `decodeURIComponent`, `btoa`, `atob`, `escape`, `unescape`, `console`, `utils`, `getIntegration`

**Not available**: `Buffer`, `fetch`, `process`, `require`, `eval`, `Function`, `global`, `globalThis`, `setTimeout`, `setInterval`

Use `btoa`/`atob` for base64, not `Buffer`. See the Gmail handlers for the correct base64url encoding pattern.

### Thin proxies vs orchestrating handlers

Most handlers should be thin:
```js
async (input) => {
  const res = await integration.fetch(`/items/${input.itemId}`)
  return await res.json()
}
```

Only add orchestration logic when the raw API is genuinely hard for an LLM to use correctly:
- Multi-step workflows (e.g. GitHub: tree → blob → commit → ref)
- Required transforms (e.g. ADF ↔ Markdown, base64 MIME, RFC822)
- Higher-level convenience (e.g. "find text then act" for Docs)

### File extraction

For downloadable files and attachments, use `utils.extractFileContent()` rather than bespoke decoding logic. This goes through the shared Python extractor (MarkItDown) and supports PDF, DOCX, XLSX, PPTX, CSV, text, HTML, and more.

```js
// Public or pre-signed URL — no integration auth
const extracted = await utils.extractFileContent({
  auth: false,
  source: item.downloadUrl,
})

// Relative or absolute URL using this integration's auth
const extracted = await utils.extractFileContent({
  auth: true,
  source: `/drives/${driveId}/items/${itemId}/content`,
})
```

Returns `{ kind, content, warnings?, metadata? }`.

Do **not** use `extractFileContent` for native structured resources like Google Docs, Sheets, Slides, or Confluence pages — use their native export/content APIs instead.

---

## credentials.json

Defines how users provide secrets and how those secrets are injected into API requests.

```json
{
  "variants": {
    "api_key": {
      "label": "API Key",
      "schema": { ... },          // JSON Schema for the credential fields
      "injection": {
        "headers": { "Authorization": "Bearer {{apiKey}}" },
        "query":   { "key": "{{apiKey}}" }
      },
      "healthCheck": { "path": "/me" }
    }
  },
  "default": "api_key"
}
```

The `injection` object uses `{{placeholder}}` templates. Placeholders must match field names in the credential `schema`.

For OAuth flows that require a token exchange before injection (e.g. SharePoint client credentials → access token), use a `preprocess` handler:

```json
"preprocess": {
  "type": "handler",
  "handler": "handlers/auth/get_access_token.js",
  "allowedOrigins": ["https://login.microsoftonline.com"]
}
```

The preprocess handler receives `(creds, utils)` and returns an object whose keys are available as placeholders in `injection`. `utils.tokenFetch` is available for outbound token requests.

`healthCheck` is either `{ "path": "/some/endpoint" }` (GET, expects 2xx) or `{ "notViable": true }` (skip health check — used when OAuth tokens are short-lived and the check is meaningless before first use).

---

## credentials_hint.md

Numbered, human-readable steps telling users exactly how to obtain credentials for this integration. Shown in the Commandable UI credential form and in the builder LLM context.

Required format:
```
1. Go to https://...
2. Create an application / generate an API key / ...
3. Copy the ... and paste it into this integration.
```

---

## usage_guide.md

Optional. Appended to the system prompt when this integration's toolset is active. Use it for:

- Non-obvious API patterns the model cannot infer from tool descriptions (e.g. Jira ADF, Gmail threading, Sheets A1 notation)
- Recommended multi-step workflows
- Important caveats or gotchas

Keep it concise. Tool descriptions should handle the common cases; the usage guide is for edge cases and cross-tool patterns.

The registry generator prefers `usage_guide.md` and falls back to legacy `prompt.md` if the new file is absent. The generated registry stores this text on the `usageGuide` field; `loadIntegrationUsageGuide()` returns it.

---

## Variants

A variant is a scoped version of a base integration where **some parameters are injected from a user-configured context** rather than supplied by the agent each time.

Examples:
- `trello-board`: board ID is pre-configured; board-scoped tools omit the `boardId` arg
- `sharepoint-folder`: site, drive, and folder are pre-configured; folder-scoped tools omit those args

A variant is **not** a different credential type. It is a different "lens" on the same integration — same auth, different tool shapes.

### Variant manifest

Lives at `variants/<variant-type>/manifest.json`:

```json
{
  "type": "variant-type-key",
  "variantLabel": "Human-readable variant name",
  "variantConfig": [
    {
      "key": "board",
      "label": "Board",
      "selectionMode": "single",
      "listHandler": "async (config) => { ... }"
    }
  ],
  "tools": [
    {
      "name": "get_cards",
      "from": "get_board_cards",
      "description": "List cards on the connected board.",
      "injectFromConfig": { "boardId": "boardId" }
    },
    { "name": "get_card" }
  ]
}
```

### `variantConfig`

Each entry declares a user-selectable value that is stored as integration config and injected at runtime. The `listHandler` is a JS function `async (config) => [{ id, name }]` that fetches available options for the config picker UI.

### Tool entries in a variant manifest

Each tool in the variant's `tools` array can:

| Pattern | Effect |
|---|---|
| `{ "name": "get_card" }` | Inherit the base tool unchanged (same schema, handler, description) |
| `{ "name": "get_cards", "from": "get_board_cards", "description": "..." }` | Rename the base tool and override description |
| `{ "name": "get_cards", ..., "injectFromConfig": { "boardId": "boardId" } }` | Inject config values into tool input — the injected field is **stripped from the schema** the agent sees |

The variant inherits the base integration's `name`, `baseUrl`, `credentials.json`, usage guide (`usage_guide.md` / legacy `prompt.md`), and any `utils` bundles unless the variant manifest explicitly overrides them.

### `injectFromConfig`

The key-value map `{ "toolInputField": "configKey" }` tells the runtime to take `integration.config[configKey]` and inject it as `toolInputField` before the handler runs. The schema presented to the agent has those fields removed so the agent does not need to supply them.

This is how `trello-board` can offer `get_cards` with no input (the board ID is already bound) while the base `trello` integration's `get_board_cards` requires an explicit `boardId`.

---

## Naming conventions

| Pattern | When to use |
|---|---|
| `list_*` | Returns a collection of resources |
| `get_*` | Returns a single resource by ID; returns metadata/IDs the agent uses for follow-up calls |
| `read_*` | Returns resource **content** in agent-friendly format (Markdown, extracted text) |
| `create_*` | Creates a resource |
| `update_*` / `patch_*` | Full replace vs partial update |
| `delete_*` | Removes a resource (always `scope: write`) |
| `search_*` | Full-text or query-based search |

Prefer `read_*` over `get_*` when the output is content the agent consumes directly (a document's text, a spreadsheet's rows). Use `get_*` when the output is metadata enabling further API calls (IDs, names, timestamps).

---

## Tool design principles

Copied from `new_integration_prompt.md` and `integrations/README.md` for completeness:

1. **Return agent-friendly content, not raw API JSON.** Decode base64, convert ADF to Markdown, flatten nested response trees. The agent should deal with human-readable strings, not encoding details.
2. **Remove tools agents cannot realistically use.** If a tool requires the agent to construct a MIME message, DataFilter object, or GridRange spec, either abstract it away or delete it.
3. **Rich descriptions.** Include what the tool does, when to use it over alternatives, key parameter hints, and cross-references to related tools.
4. **Escape hatches.** Complex conversion logic should have a plain-text fallback so the agent always gets something useful.
5. **Strict schemas.** `additionalProperties: false` by default. Match field names to API parameter names.

---

## Adding a new integration — checklist

1. Create `integrations/<type>/` with required files
2. Run `yarn workspace @commandable/integration-data run generate:registry`
3. Verify the registry builds cleanly and the new type appears in `src/generated/registry.ts`
4. Add `integrations/<type>/__tests__/` with at minimum a `usage_parity.test.ts`
5. Run `yarn workspace @commandable/integration-data test`
6. Commit both the source files and the regenerated registry

---

## Adding a variant — checklist

1. Create `integrations/<base-type>/variants/<variant-type>/manifest.json`
2. Add a reference to the variant in the base `manifest.json`:
   ```json
   "variants": [{ "type": "<variant-type>", "manifest": "variants/<variant-type>/manifest.json" }]
   ```
3. Run `generate:registry` and verify the variant type appears as a separate entry in the registry with `variantOwnerType` set to the base type
4. Add `variants/<variant-type>/__tests__/manifest.test.ts` to assert inherited metadata and config injection behaviour
5. Commit source and regenerated registry

---

## Loader API (consumers)

```ts
import {
  loadIntegrationManifest,    // Manifest | null
  loadIntegrationUsageGuide,  // string | null
  loadIntegrationToolList,    // ToolListItem[] (lightweight, no handler code)
  loadIntegrationToolsets,    // Record<string, ToolsetMeta> | null
  loadIntegrationCredentialConfig,  // IntegrationCredentialConfig | null
  loadIntegrationVariants,    // CredentialVariantsFile | null
  loadIntegrationHint,        // string | null
  listIntegrationTypes,       // string[]
  listIntegrationCatalog,     // IntegrationCatalogItem[]
} from '@commandable/integration-data'

import { loadIntegrationTools } from '@commandable/integration-data/tools'
// Returns { read: ToolData[], write: ToolData[], admin: ToolData[] } | null
// ToolData includes handlerCode — only import via /tools when you need runtime execution
```
