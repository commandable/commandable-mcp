# @commandable/mcp

Connect your everyday apps to any AI assistant that supports the Model Context Protocol (MCP). Commandable MCP is a single encrypted, self-hosted server and CLI that works with MCP clients like Claude Desktop and Cursor.

## Quick start

### 1) Run the setup wizard

```bash
npx @commandable/mcp init
```

This walks you through selecting integrations and entering API credentials. Credentials are encrypted immediately and stored locally on your machine (not in your project).

### 2) Add the snippet to your MCP client

The wizard prints a JSON snippet to paste into your MCP client config.

For Claude Desktop, edit `~/Library/Application Support/Claude/claude_desktop_config.json` and add the `mcpServers.commandable` block.

### 3) Restart your MCP client

Restart Claude Desktop (or reload the Cursor window) so it picks up the new MCP server.

## CLI

- `npx @commandable/mcp init`: first-time setup
- `npx @commandable/mcp add`: add more integrations later
- `npx @commandable/mcp status`: show enabled integrations

## Repository

Source lives in the monorepo at `commandable-mcp/packages/server`.

