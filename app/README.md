# Commandable MCP App (Server mode)

This Nuxt/Nitro app provides **server mode** for Commandable:

- **Management UI** at `/`
- **MCP Streamable HTTP endpoint** at `/mcp`
- **Health check** at `/health`

For the canonical setup and Docker instructions, see the root `commandable-mcp/README.md`.

## Development

From `commandable-mcp/app`:

```bash
pnpm install
pnpm dev
```

The app will run on `http://localhost:3000` by default.

## Configuration

Server mode is configured via environment variables and/or a config file. See:

- `commandable-mcp/.env.example`
- root `commandable-mcp/README.md` (Server mode + config-as-code)
