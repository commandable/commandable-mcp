# Contributing to Commandable MCP

Thanks for helping improve Commandable MCP.

This repo now has three package layers:

- `@commandable/mcp`: the published Nuxt app/server package and human-facing CLI
- `@commandable/mcp-connect`: the published stdio connector package
- `@commandable/mcp-core`: the shared runtime package

## Development Setup

### Prerequisites

- Node.js **18+**
- Yarn **4+**

### Install dependencies

```bash
yarn install
```

## Main Local Workflow

The contributor workflow uses an isolated data directory (`~/.commandable-dev`) and port (`23433`) so it stays separate from your normal local instance.

### 1. Start the dev server/app package

```bash
yarn dev:serve
```

If you want a completely fresh local dev database state first:

```bash
yarn dev:destroy
yarn dev:serve
```


This starts the management UI at `http://127.0.0.1:23433/`, the dynamic MCP endpoint at `http://127.0.0.1:23433/mcp`, the static MCP endpoint at `http://127.0.0.1:23433/mcp/static`, and the create MCP endpoint at `http://127.0.0.1:23433/mcp/create`. It always restarts the daemon so you are always on the latest build.

### 2. Print the Claude Code create command

```bash
yarn dev:create
```

This prints the Claude Code replacement steps for the local dev instance, including removing any existing `commandable` entry before adding the dev one. Previous Commandable instances keep their own state and can be added back later. Then restart Claude Code.




### 3. Check its connected correctly

```bash
claude mcp list
```

### 4. Use with claude code 

```bash
claude 
```

## Workspace Responsibilities

### `app/`

This is the published `@commandable/mcp` package.

It owns:

- the Nuxt management UI
- the `/mcp`, `/mcp/static`, and `/mcp/create` HTTP endpoints
- the local server lifecycle CLI (`serve`, `doctor`, `destroy`, `create-api-key`)
- the user-facing `create` and `connect` commands

### `packages/connect/`

This is the published `@commandable/mcp-connect` package.

It owns:

- `create-mode`
- `dynamic-mode`
- `static-mode` and the `read-mode` alias
- hard failure when the local server is unavailable

### `packages/core/`

This folder now builds the shared `@commandable/mcp-core` package.

It owns reusable:

- DB and migrations
- integration registry/data loading/proxy logic
- MCP runtime and meta-tools
- config loading/apply logic
- local credential/storage primitives

## Tests

Run the default repo test suite:

```bash
yarn test
```

Run all workspace tests:

```bash
yarn test:all
```
## Tests

Run all workspace tests:

```bash
yarn test
```

Run MCP package tests only:

```bash
yarn workspace @commandable/mcp test
```

### Live integration tests (accounts + CI)

Some tests under `packages/server/integration-data/*/__tests__` are **live integration tests**. They make real API calls and require credentials (usually via **managed OAuth** env vars like `COMMANDABLE_MANAGED_OAUTH_BASE_URL`, `COMMANDABLE_MANAGED_OAUTH_SECRET_KEY`, and `<PROVIDER>_TEST_CONNECTION_ID`).

- **CI**: these live tests are intended to run against **Commandable-owned test accounts** and connections.
- **Local development**: please run live tests against **your own accounts** locally. If you don't have the required env vars set, those suites will be skipped automatically.

---

## Adding a new integration

Most integrations are implemented as **integration-data** (schemas + sandboxed JS handlers), plus a provider entry in the registry.

### 1) Add integration-data

Create a new folder:

`packages/server/integration-data/<integration-type>/`

Required files (see `integration-data/new_integration_prompt.md` for the exact contract):

- `manifest.json`
- `schemas/*.json`
- `handlers/*.js`
- `credentials.json`
- `credentials_hint.md` (numbered steps for humans)
- `prompt.md` (optional)

Design guidance:

- **Read tools** must be side-effect free (GET only).
- **Write tools** should map cleanly to POST/PUT/PATCH/DELETE.
- Prefer **small, composable tools** that mirror the API's resources.
- Handlers should be thin proxies: `integration.fetch(path, init?)` → return JSON.

### 2) Register the provider

Add your integration to the provider registry so the runtime knows how to talk to it:

- `packages/server/src/integrations/providerRegistry.ts`

### 3) Add tests

Put integration tests under:

`packages/server/integration-data/<integration-type>/__tests__/`

At minimum:

- Add a `usage_parity.test.ts` (there are examples in `github/`, `notion/`, `google-sheet/`, etc.).

Then run:

```bash
yarn workspace @commandable/mcp test
```

---

## Publishing to npm

Packages must be published in dependency order:

- `@commandable/integration-data` (base data package)
- `@commandable/mcp-core` (depends on integration-data)
- `@commandable/mcp-connect` (depends on mcp-core)
- `@commandable/mcp` (depends on mcp-core)

```bash
# Authenticate (opens browser)
yarn npm login

# 1. Publish integration-data
yarn workspace @commandable/integration-data npm publish

# 2. Publish core runtime
yarn workspace @commandable/mcp-core npm publish

# 3. Publish stdio connector
yarn workspace @commandable/mcp-connect npm publish

# 4. Publish app/server package
yarn workspace @commandable/mcp npm publish
```

---

## Submitting a PR

- Create a focused branch and keep PRs small when possible.
- Update docs when behavior changes, especially the `serve / create / connect` flow.
- Make sure `yarn test` passes from the repo root.

## Local-first security expectations

- Do not commit credentials or `.env` files with secrets.
- Prefer `${ENV_VAR}` references in `commandable.config.yaml` examples.
