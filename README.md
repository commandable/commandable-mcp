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

## CI (credentials smoke tests)

The `@commandable/mcp` server package includes a small live smoke suite (`packages/server/src/__tests__/credentialsSmoke.test.ts`) that verifies the **credentials-based** auth path works end-to-end for:

- GitHub (`GET /user`) (optional; skipped if no token)
- Trello (`GET /members/me`)
- Google Sheets (`GET /spreadsheets/{id}`) using a **service account**

### GitHub Actions secrets to add

Add these repository secrets:

- **TRELLO_API_KEY**: Trello API key
- **TRELLO_API_TOKEN**: Trello API token
- **GOOGLE_SERVICE_ACCOUNT_JSON**: full service account key JSON (paste the entire JSON file content)
- **GOOGLE_SHEETS_TEST_SPREADSHEET_ID**: a spreadsheet ID that is shared with the service account `client_email`

GitHub is optional: the workflow uses the default Actions token (`secrets.GITHUB_TOKEN`). If you want the smoke test to hit GitHub as a real user, add a PAT as a secret and map it to `GITHUB_TOKEN` in the workflow.

### Google service account setup (Sheets)

- Create a service account in Google Cloud and download a JSON key.
- Share your test spreadsheet with the service account email (`client_email`) with viewer/editor access as needed.
- Store the key JSON in `GOOGLE_SERVICE_ACCOUNT_JSON` and the spreadsheet ID in `GOOGLE_SHEETS_TEST_SPREADSHEET_ID`.

The CI workflow is `.github/workflows/commandable-mcp-ci.yml`.

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
