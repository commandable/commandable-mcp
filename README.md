# Commandable MCP

Commandable is one MCP server for connecting to ANY app or service. 

Instead of directly providing all connection, commandable providers your agents the tools to create and use their own MCP tools securely.

## How it works

Commandable is the layer that stores your integrations, credentials, and tool definitions.

- Use `create` with Claude Code to configure integrations and build tools.
- Use `connect` to wire Claude Desktop, Cursor, or any other read client to the resulting MCP server.

## Quick start: local package flow

This is the main path for trying Commandable from the published package.

### 1) Start the local Commandable instance

```bash
npx -y @commandable/mcp serve
```

### 2) Connect Claude Code for create

```bash
npx -y @commandable/mcp create
```

That prints the exact `claude mcp add ...` command. Run it, then restart Claude Code.

### 3) Start building

Open Claude Code and configure integrations, toolsets, and custom tools in your create session.

### 4) Connect a read client

After your create session has configured the server, print a read-client snippet:

```bash
npx -y @commandable/mcp connect --client claude-desktop
```

For Cursor:

```bash
npx -y @commandable/mcp connect --client cursor
```

Restart the client after adding the snippet. Read clients only see the tools that already exist on the server, so reconnect or restart them after create-side changes.

## Quick start: deployed HTTP flow

Use this when Commandable is running as a shared or remote service.

### 1) Run the app deployment

Locally, from this repo:

```bash
yarn dev
```

For Docker and deployment examples, see the app section below and `app/README.md`.

### 2) Create an API key

```bash
DATABASE_URL="$DATABASE_URL" COMMANDABLE_ENCRYPTION_SECRET="$COMMANDABLE_ENCRYPTION_SECRET" \
  npx -y @commandable/mcp create-api-key my-app
```

### 3) Connect Claude Code to the remote instance

```bash
npx -y @commandable/mcp create --transport http --url http://localhost:3000/mcp/create --api-key <your-api-key>
```

Run the printed command, then restart Claude Code.

### 4) Print read-client connection details

```bash
npx -y @commandable/mcp connect --transport http --url http://localhost:3000/mcp --api-key <your-api-key>
```

## Local-source development

If you are working from this repo and want the same `serve/create/connect` model against local source, use the flow in [`CONTRIBUTING.md`](./CONTRIBUTING.md).

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

Commandable looks for config in this order:

1. `--config <path>`
2. `COMMANDABLE_CONFIG_FILE`
3. `./commandable.config.yaml`, `./commandable.config.yml`, `./commandable.config.json`

Key environment variables:

- `COMMANDABLE_ENCRYPTION_SECRET`
- `DATABASE_URL`
- `COMMANDABLE_CONFIG_FILE`
- `COMMANDABLE_DATA_DIR`
- `COMMANDABLE_MODE` (stdio/local create-mode only; HTTP uses `/mcp` and `/mcp/create`)
- `COMMANDABLE_INTEGRATION_DATA_DIR`

---

## CLI reference

| Command | What it does |
|---------|--------------|
| `commandable-mcp serve [--restart]` | Start or reuse the local Commandable instance |
| `commandable-mcp create [--transport stdio\|http] [--source package\|local] [--apply] [--url] [--api-key]` | Print or apply the Claude Code create-flow registration command |
| `commandable-mcp connect [--client claude-desktop\|cursor] [--transport stdio\|http] [--source package\|local] [--url] [--api-key]` | Print read-client connection details |
| `commandable-mcp apply [--config <file>]` | Apply config-as-code idempotently (CI-friendly) |
| `commandable-mcp doctor` | Print diagnostic info for local state, daemon, and active env wiring |
| `commandable-mcp reset local [--yes] [--keep-key]` | Stop daemon and wipe local SQLite/pid (and key unless `--keep-key`) |
| `commandable-mcp create-api-key [name]` | Create an API key for the HTTP MCP endpoints |
| `commandable-mcp --help` | Show usage |
| `commandable-mcp --version` | Print version |

---

## Security

Commandable encrypts credentials immediately and stores them in your home directory (`~/.commandable/`), outside any project.

In deployed HTTP setups, use `commandable.config.yaml` with `${ENV_VAR}` references and inject secrets through your deployment environment.

---

## Legacy / advanced flows

- `commandable-mcp static-init`: legacy wizard-first bootstrap
- `commandable-mcp add`: add integrations interactively outside the create flow
- `commandable-mcp apply --config ...`: headless config reconciliation

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for local-source development, testing, and publishing.

## License

AGPL v3. See [LICENSE](./LICENSE).
