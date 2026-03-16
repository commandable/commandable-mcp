# @commandable/mcp App Package

This workspace is the published `@commandable/mcp` package.

It owns:

- the Nuxt management UI
- the `/mcp` dynamic endpoint
- the `/mcp/static` compatibility endpoint
- the `/mcp/create` create endpoint
- the local server lifecycle CLI
- the human-facing `create` and `connect` commands

## Main Commands

```bash
npx -y @commandable/mcp serve
npx -y @commandable/mcp create
npx -y @commandable/mcp connect --client claude-desktop
```

The generated local client snippets target `@commandable/mcp-connect`.

## Development

From the repo root:

```bash
yarn install
yarn workspace @commandable/mcp dev
```

For the full local product flow, prefer the root scripts:

```bash
yarn dev:serve
yarn dev:create
yarn dev:connect
```

## HTTP Deployment

For remote/shared deployments, run this package as the app server and use:

```bash
npx -y @commandable/mcp create --transport http --url <create-url> --api-key <api-key>
npx -y @commandable/mcp connect --transport http --url <read-url> --api-key <api-key>
```

Recommended URLs:

- dynamic: `<base-url>/mcp`
- static: `<base-url>/mcp/static`
- create: `<base-url>/mcp/create`

## Notes

- The old embedded-bundle-in-another-package model is gone.
- This package now publishes and runs the built Nuxt app directly.
