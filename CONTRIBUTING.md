# Contributing to Commandable MCP

Thanks for helping improve Commandable MCP.

This repo is a monorepo. The npm package is `@commandable/mcp` and the HTTP/UI runtime lives in `app/`.

## Development setup

### Prerequisites

- Node.js **18+**
- Yarn **4+** (the repo uses workspaces)

### Install dependencies

From the repo root:

```bash
yarn install
```

## Running locally

The contributor dev workflow uses an isolated data directory (`~/.commandable-dev`) and port (`23433`), completely separate from your normal local Commandable instance (`~/.commandable`, port `23432`) and from any deployed HTTP environment.

### 1) Build local source

```bash
yarn workspace @commandable/mcp prepack
```

### 2) Start the dev instance

```bash
yarn dev:serve
```

This starts the management UI at `http://127.0.0.1:23433/`, the read MCP endpoint at `http://127.0.0.1:23433/mcp`, and the create MCP endpoint at `http://127.0.0.1:23433/mcp/create`. It always restarts the daemon so you are always on the latest build.

### 3) Connect Claude Code

```bash
yarn dev:create
```

This prints the Claude Code replacement steps for the local dev instance, including removing any existing `commandable` entry before adding the dev one. Previous Commandable instances keep their own state and can be added back later. Then restart Claude Code.

### 4) Print a read-client snippet

```bash
yarn dev:connect
```

### Reset or wipe dev state

```bash
yarn dev:reset    # wipe dev state and restart fresh
yarn dev:destroy  # wipe dev state only, no restart
```

These only affect `~/.commandable-dev`. Your normal local instance and any deployed environments are untouched.

### Diagnostics

```bash
yarn dev:doctor
```

### Nuxt app development (UI-only)

To work directly on the management UI app without the CLI daemon wrapper:

```bash
yarn dev
```

This serves the Nuxt app at `http://localhost:3000/`. Create an API key first if needed:

```bash
node packages/server/dist/cli/bin.js create-api-key dev
```

Then print connection details:

```bash
node packages/server/dist/cli/bin.js create --transport http --url http://localhost:3000/mcp/create --api-key <your-api-key>
node packages/server/dist/cli/bin.js connect --transport http --url http://localhost:3000/mcp --api-key <your-api-key>
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

Packages must be published in dependency order. `@commandable/mcp` depends on `@commandable/integration-data`, so publish integration-data first.

```bash
# Authenticate (opens browser)
yarn npm login

# 1. Publish integration-data
yarn workspace @commandable/integration-data npm publish

# 2. Publish the server
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
