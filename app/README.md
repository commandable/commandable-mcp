# Commandable App

This Nuxt/Nitro app is the HTTP deployment runtime for Commandable.

It serves:

- the management UI at `/`
- the read MCP HTTP endpoint at `/mcp`
- the create MCP HTTP endpoint at `/mcp/create`
- the health check at `/health`

For the main product flow, see the root `README.md`. The short version is:

1. run this app
2. use `commandable-mcp create --transport http --url http://<host>/mcp/create ...` for Claude Code
3. use `commandable-mcp connect --transport http --url http://<host>/mcp ...` for read-client connection details

## Development

From the repo root:

```bash
yarn install
yarn dev
```

The app runs on `http://localhost:3000` by default.

## Configuration

The app is configured via environment variables and/or a config file. See:

- `.env.example`
- the root `README.md`
