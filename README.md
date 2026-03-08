# Commandable MCP

Commandable MCP is the last mcp server you need. 

It allows your agents to create their own mcp servers and tools from scratch, securely. One MCP, any app.

https://github.com/user-attachments/assets/ac66133c-162f-4959-81c9-664010d40b3b

## Quick Start: Local Flow

### 1. Start the local Commandable instance

```bash
npx -y @commandable/mcp serve
```

### 2. Connect Claude Code for create mode

```bash
npx -y @commandable/mcp create
```

This prints the exact `claude mcp add ...` command. That command now targets `@commandable/mcp-connect create-mode`.
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

Both snippets point read clients at `@commandable/mcp-connect`.

## Quick Start: HTTP Flow

Use this when Commandable is running as a shared or remote service.

### 1. Run the app/server package

From this repo:

```bash
yarn workspace @commandable/mcp dev
```

### 2. Create an API key

```bash
DATABASE_URL="$DATABASE_URL" COMMANDABLE_ENCRYPTION_SECRET="$COMMANDABLE_ENCRYPTION_SECRET"   npx -y @commandable/mcp create-api-key my-app
```

### 3. Print Claude Code HTTP setup

```bash
npx -y @commandable/mcp create --transport http --url http://localhost:3000/mcp/create --api-key <your-api-key>
```

### 4. Print read-client HTTP details

```bash
npx -y @commandable/mcp connect --transport http --url http://localhost:3000/mcp --api-key <your-api-key>
```

## Local Source Development

If you are working from this repo, use the contributor workflow in [`CONTRIBUTING.md`](./CONTRIBUTING.md).

## Supported Integrations

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

## Configuration

Commandable looks for config in this order:

1. `--config <path>`
2. `COMMANDABLE_CONFIG_FILE`
3. `./commandable.config.yaml`, `./commandable.config.yml`, `./commandable.config.json`

Important environment variables:

- `COMMANDABLE_ENCRYPTION_SECRET`
- `DATABASE_URL`
- `COMMANDABLE_CONFIG_FILE`
- `COMMANDABLE_DATA_DIR`
- `COMMANDABLE_MCP_SQLITE_PATH`
- `COMMANDABLE_UI_PORT`
- `COMMANDABLE_INTEGRATION_DATA_DIR`

## CLI Reference

| Command | What it does |
|---------|--------------|
| `commandable-mcp serve [--restart]` | Build/run the local Commandable app server and management UI |
| `commandable-mcp create [--transport stdio\|http] [--apply] [--url] [--api-key]` | Print or apply Claude Code setup instructions |
| `commandable-mcp connect [--client claude-desktop\|cursor] [--transport stdio\|http] [--url] [--api-key]` | Print read-client connection details |
| `commandable-mcp doctor` | Print diagnostics for the local server and environment |
| `commandable-mcp destroy local --yes [--keep-key]` | Stop the daemon and wipe local state |
| `commandable-mcp apply [--config <file>]` | Apply config-as-code against the current environment |
| `commandable-mcp create-api-key [name]` | Create an API key for HTTP MCP endpoints |
| `commandable-mcp --help` | Show usage |
| `commandable-mcp --version` | Print version |

## Notes

- `@commandable/mcp create` and local `connect` flows now hard-fail if the local server is not already running.
- `@commandable/mcp-connect` is intentionally machine-facing. Most humans only need `@commandable/mcp`.
- The old embedded Nitro bundle flow is gone. The published app package now runs as itself.

## Security

Commandable encrypts credentials immediately and stores them in your home directory (`~/.commandable/`) unless you override `COMMANDABLE_DATA_DIR`.

In deployed HTTP setups, use `commandable.config.yaml` with `${ENV_VAR}` references and inject secrets through your deployment environment.

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for development, testing, and publishing.

## License

AGPL v3. See [LICENSE](./LICENSE).
