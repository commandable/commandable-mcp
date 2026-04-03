Integration Data
================

Purpose
-------

This directory contains per-integration metadata and tool templates to inject standard read/write capabilities into tasks.

Structure
---------

Each integration lives under its own folder, e.g. `lib/integration-data/trello/`, with:

- `manifest.json`: declarative index of tools and files
- `schemas/*.json`: JSON Schemas for tool inputs
- `handlers/*.js`: JavaScript handlers executed in the sandbox; use `integration.fetch()`
- `prompt.md` (optional): extra prompt notes shown to the LLM
- `openapi.json` (optional): reference spec; not used at runtime

Manifest format
---------------

```
{
  "name": string,
  "version": string,
  "baseUrl"?: string,
  "tools": {
    "read": [ToolRef],
    "write": [ToolRef]
  }
}

ToolRef := {
  "name": string,
  "description": string,
  "inputSchema": string,   // path to JSON schema file
  "handler": string        // path to JS handler file
}
```

Handler pattern
---------------

Handlers use the `integration.fetch(path, options?)` pattern rather than binding to a concrete integration id. At runtime, the host binds the task's selected integration instance as `integration` in the sandbox.

For downloadable files and attachments, handlers can also call `utils.extractFileContent()`:

- `utils.extractFileContent({ auth: false, source: <absolute-url> })` for public or pre-signed downloads
- `utils.extractFileContent({ auth: true, source: <relative-or-absolute-url> })` to reuse the current integration's auth

This utility is for downloadable files only. Native structured resources like Google Docs, Sheets, and Slides should continue to use their native APIs or export endpoints.

Notes
-----

- Keep schemas strict and aligned with handler expectations.
- Read tools MUST be side-effect free (GET only). Write tools include POST/PUT/DELETE.
- Prefer small, composable tools that mirror API resources.
