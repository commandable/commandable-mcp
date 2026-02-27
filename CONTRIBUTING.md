# Contributing to Commandable MCP

Thanks for helping improve Commandable MCP.

This repo is a monorepo. The npm package is `@commandable/mcp` (CLI + stdio MCP server), and server mode (UI + HTTP `/mcp`) lives in `app/`.

## Development setup

### Prerequisites

- Node.js **18+**
- Yarn Classic (**v1**) (the repo uses workspaces)

### Install dependencies

From the repo root:

```bash
yarn install
```

## Running locally

### CLI + stdio MCP server

Build the package:

```bash
yarn workspace @commandable/mcp build
```

Run the CLI:

```bash
node packages/server/dist/cli/bin.js --help
node packages/server/dist/cli/bin.js init
```

### Server mode (UI + MCP over HTTP)

```bash
yarn workspace commandable-mcp-app dev
```

By default the app runs at `http://localhost:3000`.

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
- **Local development**: please run live tests against **your own accounts** locally. If you don’t have the required env vars set, those suites will be skipped automatically.

We’ll follow up over time on running more of these in CI under our accounts as coverage expands.

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
- Prefer **small, composable tools** that mirror the API’s resources.
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

## Submitting a PR

- Create a focused branch and keep PRs small when possible.
- Update docs when behavior changes (especially the `npx` first-run / client config snippet).
- Make sure `yarn test` passes from the repo root.

## Local-first security expectations

- Do not commit credentials or `.env` files with secrets.
- Prefer `${ENV_VAR}` references in `commandable.config.yaml` examples.

