# Commandable MCP

One MCP server for all of your apps.

Commandable MCP is a secure, open-source MCP server supporting 10 integrations and 200+ tools. We aim to support many many more than this in the near future.

## Warning: Rapidly Changing Project

This repository is currently in flux and may include frequent breaking changes between versions until the first stable release.

For now, please:

- Save your keys somewhere safe outside this project.
- Re-run `commandable-mcp init` after each new version update.

**Ways to use:** 
- **Desktop mode (stdio)**: run a local MCP server that Claude Desktop / Cursor spawns for you. Great for personal use and “set it and forget it”.
- **Server mode (HTTP + UI)**: a docker file that serves **(1)** a management UI and **(2)** an MCP Streamable HTTP endpoint. Great for agent frameworks, shared environments, and CI-friendly config-as-code.

---

## Quick start: Desktop mode (Claude Desktop / Cursor)

### 1) Run the setup wizard

```bash
npx -y @commandable/mcp init
```

This walks you through selecting integrations and entering credentials. Credentials are encrypted immediately and stored outside your project (default: `~/.commandable/`).

If you prefer a global install (no `npx`), you can also do:

```bash
npm install -g @commandable/mcp
commandable-mcp init
```

### 2) Add the snippet to your MCP client

**Claude Desktop** — edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "commandable": {
      "command": "npx",
      "args": ["-y", "@commandable/mcp"]
    }
  }
}
```

If your setup wizard prints a snippet without `-y`, add it — it avoids interactive install prompts on first run.

**Cursor** — open Settings → MCP → Add server, then paste the same JSON block.

### 3) Restart your MCP client

Restart Claude Desktop or reload the Cursor window. Your assistant can now use the tools you configured.

---

## Quick start: Server mode (Management UI + MCP over HTTP)

Server mode is for when you want to connect by URL (agent frameworks) and/or manage integrations in a browser.

### 1) Create a config file (config-as-code)

Create `commandable.config.yaml`:

```yaml
integrations:
  - type: github
    toolsets: [code, pull_requests, ci]
    credentials:
      token: ${GITHUB_TOKEN}

  - type: trello
    credentials:
      apiKey: ${TRELLO_API_KEY}
      apiToken: ${TRELLO_API_TOKEN}
```

`${VAR_NAME}` values are resolved from your environment at startup.

### 2) Run the server (Docker)

#### Option A: Use prebuilt Docker image (GHCR)

```bash
docker pull ghcr.io/commandable/commandable-mcp:latest
docker run --rm -p 3000:3000 \
  -e COMMANDABLE_ENCRYPTION_SECRET="$COMMANDABLE_ENCRYPTION_SECRET" \
  -e DATABASE_URL="$DATABASE_URL" \
  -e COMMANDABLE_CONFIG_FILE=/app/commandable.config.yaml \
  -v "$PWD/commandable.config.yaml:/app/commandable.config.yaml:ro" \
  ghcr.io/commandable/commandable-mcp:latest
```

#### Option B: Build locally

```bash
docker build -t commandable-mcp .
docker run --rm -p 3000:3000 \
  -e COMMANDABLE_ENCRYPTION_SECRET="$COMMANDABLE_ENCRYPTION_SECRET" \
  -e DATABASE_URL="$DATABASE_URL" \
  -e COMMANDABLE_CONFIG_FILE=/app/commandable.config.yaml \
  -v "$PWD/commandable.config.yaml:/app/commandable.config.yaml:ro" \
  commandable-mcp
```

#### Image tags

- `latest`: most recent tagged release (`v*`)
- `main`: latest build from the `main` branch
- `vX.Y.Z`: exact release tag

This starts an app that serves:

- **Management UI**: `http://localhost:3000/`
- **MCP Streamable HTTP**: `http://localhost:3000/mcp`
- **Health check**: `http://localhost:3000/health`

### 3) Create an API key for `/mcp`

`/mcp` requires `Authorization: Bearer <api-key>`. Create a key against the same DB:

```bash
DATABASE_URL="$DATABASE_URL" COMMANDABLE_ENCRYPTION_SECRET="$COMMANDABLE_ENCRYPTION_SECRET" \
  npx -y @commandable/mcp create-api-key my-app
```

Store the printed key somewhere safe (it is only shown once).

---

## Using with OpenAI Agents SDK (HTTP)

```python
from agents.mcp import MCPServerStreamableHttp

mcp = MCPServerStreamableHttp(
    name="commandable",
    params={
        "url": "http://localhost:3000/mcp",
        "headers": {"Authorization": "Bearer <your-api-key>"},
    },
)
```

---

## Declarative / headless setup (CI-friendly)

Apply config without interactive prompts:

```bash
npx -y @commandable/mcp apply --config ./commandable.config.yaml
```

You can also make `init` headless by passing `--config`:

```bash
npx -y @commandable/mcp init --config ./commandable.config.yaml
```

---

## Supported integrations

<!-- INTEGRATION_TABLE_START -->
| Integration | Tools | Toolsets | Live Tests |
|---|---|---|---|
| [Airtable](packages/integration-data/integrations/airtable/) | 11 | all tools | ![Airtable tests](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/theomccabe/771bd329f303087690c522afa1baa6f3/raw/test-airtable.json) |
| [Confluence](packages/integration-data/integrations/confluence/) | 11 | all tools | ![Confluence tests](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/theomccabe/771bd329f303087690c522afa1baa6f3/raw/test-confluence.json) |
| [GitHub](packages/integration-data/integrations/github/) | 47 | `code`, `issues`, `pull_requests`, `ci`, `releases`, `repo_admin` | ![GitHub tests](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/theomccabe/771bd329f303087690c522afa1baa6f3/raw/test-github.json) |
| [Google Calendar](packages/integration-data/integrations/google-calendar/) | 17 | `events`, `sharing` | ![Google Calendar tests](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/theomccabe/771bd329f303087690c522afa1baa6f3/raw/test-google-calendar.json) |
| [Google Docs](packages/integration-data/integrations/google-docs/) | 13 | all tools | ![Google Docs tests](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/theomccabe/771bd329f303087690c522afa1baa6f3/raw/test-google-docs.json) |
| [Google Drive](packages/integration-data/integrations/google-drive/) | 9 | all tools | ![Google Drive tests](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/theomccabe/771bd329f303087690c522afa1baa6f3/raw/test-google-drive.json) |
| [Gmail](packages/integration-data/integrations/google-gmail/) | 25 | `email`, `organize` | ![Gmail tests](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/theomccabe/771bd329f303087690c522afa1baa6f3/raw/test-google-gmail.json) |
| [Google Sheets](packages/integration-data/integrations/google-sheet/) | 10 | all tools | ![Google Sheets tests](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/theomccabe/771bd329f303087690c522afa1baa6f3/raw/test-google-sheet.json) |
| [Google Slides](packages/integration-data/integrations/google-slides/) | 11 | all tools | ![Google Slides tests](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/theomccabe/771bd329f303087690c522afa1baa6f3/raw/test-google-slides.json) |
| [HubSpot](packages/integration-data/integrations/hubspot/) | 31 | all tools | ![HubSpot tests](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/theomccabe/771bd329f303087690c522afa1baa6f3/raw/test-hubspot.json) |
| [Jira](packages/integration-data/integrations/jira/) | 23 | `issues`, `boards` | ![Jira tests](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/theomccabe/771bd329f303087690c522afa1baa6f3/raw/test-jira.json) |
| [Notion](packages/integration-data/integrations/notion/) | 19 | `pages`, `databases` | ![Notion tests](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/theomccabe/771bd329f303087690c522afa1baa6f3/raw/test-notion.json) |
| [Trello](packages/integration-data/integrations/trello/) | 34 | all tools | ![Trello tests](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/theomccabe/771bd329f303087690c522afa1baa6f3/raw/test-trello.json) |
<!-- INTEGRATION_TABLE_END -->

---

## Configuration

### Config file discovery

Commandable looks for config in this order:

1. `--config <path>`
2. `COMMANDABLE_CONFIG_FILE`
3. `./commandable.config.yaml`, `./commandable.config.yml`, `./commandable.config.json`

### Toolsets

Toolsets let you expose only the tool groups you want for an integration. This keeps the MCP tool list focused and reduces context usage for coding agents.

Example:

```yaml
integrations:
  - type: github
    toolsets: [code, pull_requests, ci]
    credentials:
      token: ${GITHUB_TOKEN}
```

### Environment variables

See `.env.example` for a full list. The most important ones:

- **`COMMANDABLE_ENCRYPTION_SECRET`**: stable secret used to encrypt credentials
- **`DATABASE_URL`**: if set, uses Postgres; otherwise uses SQLite
- **`COMMANDABLE_CONFIG_FILE`**: path to `commandable.config.yaml` (optional)
- **`COMMANDABLE_DATA_DIR`**: where local state lives (default: `~/.commandable/`)
- **`COMMANDABLE_INTEGRATION_DATA_DIR`**: override the integration-data directory

---

## CLI reference

| Command | What it does |
|---------|--------------|
| `commandable-mcp init` | Interactive setup wizard (desktop mode), including toolset selection |
| `commandable-mcp init --config <file>` | Headless apply (alias of `apply`) |
| `commandable-mcp apply [--config <file>]` | Apply config-as-code idempotently (CI-friendly) |
| `commandable-mcp add` | Add more integrations interactively, including toolset selection |
| `commandable-mcp status` | Show enabled integrations |
| `commandable-mcp create-api-key [name]` | Create an API key for HTTP `/mcp` |
| `commandable-mcp` | Start stdio MCP server (spawned by MCP clients) |
| `commandable-mcp --help` | Show usage |

---

## Security

Most MCP setups ask you to put API keys directly in a config file — which then lives in your project folder, gets committed to git, and ends up in backups, logs, and teammates' laptops.

Commandable MCP doesn't work that way in desktop mode. When you enter a credential, it's encrypted immediately and stored in your home directory, outside any project. No secrets files. No “oops I committed a key.” Just secure-by-default.

In server mode, use `commandable.config.yaml` with `${ENV_VAR}` references and inject secrets via your deployment environment.

---

## Deploying

- **Docker**: use the root `Dockerfile` and mount `commandable.config.yaml` (see Quick start)
- **docker-compose**: see `docker-compose.yml` for a Postgres + Commandable example
- **CI**: run `commandable-mcp apply --config ...` to reconcile integration + credential state

---

## Testing

See [`TESTING.md`](./TESTING.md).

---


## Repo structure

```
commandable-mcp/
├── packages/server/                  # @commandable/mcp — core server + CLI
├── packages/server/integration-data/ # tool manifests/schemas/handlers per integration
└── app/                              # server mode UI + MCP endpoint (Nuxt/Nitro)
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

## License

AGPL v3. See [LICENSE](./LICENSE).
