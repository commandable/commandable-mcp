# Commandable MCP

**One MCP, any app**

Commandable MCP is the first and last MCP framework your agent needs

It lets agents build, configure, and serve MCP integrations and lightweight app backends in place, securely*

**credentials encrypted at rest, the model never sees them*

[https://github.com/user-attachments/assets/ac66133c-162f-4959-81c9-664010d40b3b](https://github.com/user-attachments/assets/ac66133c-162f-4959-81c9-664010d40b3b)

Commandable gives connected agents the tools to build their own tools. Like MCP Inception! Agents define connections to any API as JSON, ask the user to enter their credentials securely via the web api - then away they go, creating new tools against those APIs and using them even in the same turn - without even having direct access to your credentials.  
  
Commandable also ships with a growing set of prebuilt integrations out of the box for popular apps. Contributions to this library more than welcome. 

Use it when you want to:

- connect existing apps like GitHub, Notion, Google, Jira, and Trello fast
- build custom tools specific to your data in these tools 
- connect apps which have no MCP server yet 
- let an agent compose custom toolsets for a specific workflow or user
- keep credentials server-side, encrypted at rest, and out of model context

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

### 4) Connect a compatibility client

After your create session has configured the server, print a static-mode snippet for clients that do not support dynamic tool loading:

```bash
npx -y @commandable/mcp connect --client claude-desktop
```

For Cursor:

```bash
npx -y @commandable/mcp connect --client cursor
```

Both snippets point compatibility clients at `@commandable/mcp-connect static-mode`.

## MCP Modes

Commandable now ships three MCP surfaces:

- `/mcp` - dynamic mode. Starts lean and loads toolsets into the session on demand.
- `/mcp/static` - static fallback. Eager-loads all configured tools up front.
- `/mcp/create` - dynamic mode plus builder powers for adding integrations and generating custom tools.

Use dynamic mode when your client supports MCP dynamic tool loading. Use static mode for compatibility or simple setups. Use create mode when you want agents to configure Commandable itself.

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

### 4. Print dynamic HTTP details

```bash
npx -y @commandable/mcp connect --transport http --url http://localhost:3000/mcp --api-key <your-api-key>
```

### 5. Optional: print static HTTP details

For fallback clients or simple compatibility testing:

```bash
npx -y @commandable/mcp connect --transport http --url http://localhost:3000/mcp/static --api-key <your-api-key>
```

## Prebuilt Integrations

Commandable also ships with a strong set of prebuilt integrations that work out of the box. These are not the whole product, but they give you an immediate foundation: connect fast, start building, then extend or generate custom MCP capabilities as needed. The list below grows regularly.




| Integration                                                                | Tools | Toolsets                                                          | Live Tests            |
| -------------------------------------------------------------------------- | ----- | ----------------------------------------------------------------- | --------------------- |
| [Airtable](packages/integration-data/integrations/airtable/)               | 11    | all tools                                                         | Airtable tests        |
| [Confluence](packages/integration-data/integrations/confluence/)           | 11    | all tools                                                         | Confluence tests      |
| [GitHub](packages/integration-data/integrations/github/)                   | 47    | `code`, `issues`, `pull_requests`, `ci`, `releases`, `repo_admin` | GitHub tests          |
| [Google Calendar](packages/integration-data/integrations/google-calendar/) | 17    | `events`, `sharing`                                               | Google Calendar tests |
| [Google Docs](packages/integration-data/integrations/google-docs/)         | 13    | all tools                                                         | Google Docs tests     |
| [Google Drive](packages/integration-data/integrations/google-drive/)       | 9     | all tools                                                         | Google Drive tests    |
| [Gmail](packages/integration-data/integrations/google-gmail/)              | 25    | `email`, `organize`                                               | Gmail tests           |
| [Google Sheets](packages/integration-data/integrations/google-sheet/)      | 10    | all tools                                                         | Google Sheets tests   |
| [Google Slides](packages/integration-data/integrations/google-slides/)     | 11    | all tools                                                         | Google Slides tests   |
| [HubSpot](packages/integration-data/integrations/hubspot/)                 | 31    | all tools                                                         | HubSpot tests         |
| [Jira](packages/integration-data/integrations/jira/)                       | 23    | `issues`, `boards`                                                | Jira tests            |
| [Notion](packages/integration-data/integrations/notion/)                   | 19    | `pages`, `databases`                                              | Notion tests          |
| [Trello](packages/integration-data/integrations/trello/)                   | 34    | all tools                                                         | Trello tests          |




## Security

Commandable encrypts credentials immediately and stores them in your home directory (`~/.commandable/`) unless you override `COMMANDABLE_DATA_DIR`.

In deployed HTTP setups, use `commandable.config.yaml` with `${ENV_VAR}` references and inject secrets through your deployment environment.

## CLI Reference


| Command                                                                                                 | What it does                                                       |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `commandable-mcp serve [--restart]`                                                                     | Build/run the local Commandable app server and management UI |
| `commandable-mcp create [--transport stdio|http] [--apply] [--url] [--api-key]`                         | Print or apply Claude Code setup instructions                      |
| `commandable-mcp connect [--client claude-desktop|cursor] [--transport stdio|http] [--url] [--api-key]` | Print compatibility client details or HTTP endpoint config         |
| `commandable-mcp doctor`                                                                                | Print diagnostics for the local server and environment             |
| `commandable-mcp destroy local --yes [--keep-key]`                                                      | Stop the daemon and wipe local state                               |
| `commandable-mcp apply [--config <file>]`                                                               | Apply config-as-code against the current environment               |
| `commandable-mcp create-api-key [name]`                                                                 | Create an API key for HTTP MCP endpoints                           |
| `commandable-mcp --help`                                                                                | Show usage                                                         |
| `commandable-mcp --version`                                                                             | Print version                                                      |


## Contributing

See `[CONTRIBUTING.md](./CONTRIBUTING.md)` for development, testing, and publishing.

## License

AGPL v3. See [LICENSE](./LICENSE).
