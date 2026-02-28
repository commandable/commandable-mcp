## Task

Write a new integration-data folder for `<INTEGRATION_NAME>`.

## Required structure

Create `commandable-mcp/packages/server/integration-data/<name>/` containing:

- `manifest.json`: flat `tools[]`; each tool has `name`, `description`, `inputSchema` (relative path), `handler` (relative path), `scope` (`read` | `write` | optionally `admin`)
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