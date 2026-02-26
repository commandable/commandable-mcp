# Commandable MCP

Connect your everyday apps to any AI assistant that supports the [Model Context Protocol](https://modelcontextprotocol.io). Set up once, and every MCP-compatible client — Claude Desktop, Cursor, Cline, and others — gets access to all your tools through a single encrypted, self-hosted server.


## Supported integrations

| Integration | Tools |
|-------------|-------|
| GitHub | repos, issues, pull requests, commits |
| Notion | pages, databases, blocks |
| Trello | boards, lists, cards |
| Airtable | bases, tables, records |
| Google Calendar | events, calendars |
| Google Docs | documents, content |
| Google Sheets | spreadsheets, rows, cells |
| Google Slides | presentations, slides |

---

## Quick start

### 1. Run the setup wizard

```bash
npx @commandable/mcp init
```

This walks you through selecting integrations and entering your API credentials. Credentials are never stored in plain text — they're saved to an encrypted local store on your machine. It then prints a snippet to paste into your MCP client.

### 2. Add the snippet to your MCP client

**Claude Desktop** — edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "commandable": {
      "command": "npx",
      "args": ["@commandable/mcp"]
    }
  }
}
```

**Cursor** — open Settings → MCP → Add server, then paste the same JSON block.

**Other MCP clients** — use the same `npx @commandable/mcp` command.

### 3. Restart your MCP client

After saving the config, restart Claude Desktop or reload the Cursor window. Your AI assistant can now use all the tools you configured.

---

## Adding integrations later

```bash
npx @commandable/mcp add
```

Or, if your config is in a non-default location:

```bash
npx @commandable/mcp add
```

This shows only integrations you haven't set up yet and prompts for credentials. No need to touch your MCP client config — it picks up the changes automatically on next restart.

---

## After a computer restart

Nothing to do. Your MCP client reads its config at startup and launches the server automatically. Commandable MCP loads your enabled integrations and is ready.

---

## CLI reference

| Command | What it does |
|---------|-------------|
| `commandable-mcp init` | First-time setup: pick integrations, enter credentials |
| `commandable-mcp add` | Add more integrations later |
| `commandable-mcp status` | Show which integrations are enabled |
| `commandable-mcp` | Start the MCP server (used by MCP clients, not humans) |
| `commandable-mcp --help` | Show usage |

---

## Security

Most MCP setups ask you to put API keys directly in a config file — which then lives in your project folder, gets committed to git, and ends up in backups, logs, and teammates' laptops.

Commandable MCP doesn't work that way. When you enter a credential, it's encrypted immediately and stored in your home directory, outside any project. No secrets files. No “oops I committed a key.” Just secure-by-default.

Nothing is sent to Commandable, or anyone else. Your keys go from your terminal to your machine's encrypted store, and from there directly to the integration API when you use a tool. That's it.

---

## Repo structure

```
commandable-mcp/
├── packages/server/        # @commandable/mcp — the MCP server and CLI
├── packages/server/integration-data/  # Tool manifests, schemas, and handlers per integration
└── app/                    # Local management web UI (Nuxt)
```

---

## License

AGPL v3. See [LICENSE](./LICENSE).
