# @commandable/mcp

Commandable is the workflow for building and serving app-connected MCP tools.

## Quick start

### 1) Start the local instance

```bash
npx -y @commandable/mcp serve
```

### 2) Connect Claude Code for create

```bash
npx -y @commandable/mcp create
```

Run the printed `claude mcp add ...` command, then restart Claude Code.

### 3) Print a read-client snippet

```bash
npx -y @commandable/mcp connect --client claude-desktop
```

Use `--client cursor` for Cursor.

## Main commands

- `npx -y @commandable/mcp serve [--restart]`
- `npx -y @commandable/mcp create [--transport stdio|http] [--source package|local] [--apply]`
- `npx -y @commandable/mcp connect [--client claude-desktop|cursor] [--transport stdio|http] [--source package|local]`
- `npx -y @commandable/mcp doctor`
- `npx -y @commandable/mcp reset local --yes`
- `npx -y @commandable/mcp apply [--config <file>]`
- `npx -y @commandable/mcp create-api-key [name]`

Legacy / advanced:

- `npx -y @commandable/mcp static-init`
- `npx -y @commandable/mcp add`

Tip: prefer `npx -y @commandable/mcp ...` to avoid install prompts on first run.

## Repository

Source lives in the monorepo at `commandable-mcp/packages/server`.

## HTTP deployment

If you want a shared HTTP endpoint plus management UI, run the app from the monorepo. See the root `README.md` and `app/README.md`.
