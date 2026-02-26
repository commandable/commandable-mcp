# Commandable MCP — Project Context

## What is this?

Commandable MCP is an open-source tool server that connects your everyday apps (GitHub, Notion, Google Docs, Trello, Airtable, etc.) to any AI assistant that supports the Model Context Protocol (MCP). You configure your integrations once, and every MCP-compatible client — Claude Desktop, Cursor, Cline, and others — gets access to all your tools through a single endpoint.

Think of it as the universal adapter between your apps and your AI.

## Why does this exist?

Today, if you want an AI assistant to interact with your tools, you either:

- Use a closed platform that locks you in and controls your data
- Build custom integrations yourself, one per tool, per AI client
- Cobble together multiple MCP servers (one for GitHub, one for Notion, one for Google, etc.), each with its own config, auth setup, and maintenance burden

None of these are great. Commandable MCP exists so that developers and teams can:

1. **Connect once, use everywhere.** Set up your integrations in one place. Every MCP client you use gets the same tools.
2. **Own their data and infrastructure.** Self-host with zero external dependencies. Your credentials stay on your machine, encrypted at rest. No cloud account required.
3. **Get started in under 5 minutes.** Run one command, paste a couple of API keys, and you're working. If setup takes longer than 5 minutes, we've failed.

## Who is this for?

**Individual developers** who use AI coding assistants (Cursor, Claude Desktop, Cline) and want those assistants to be able to interact with their tools — create GitHub issues, query Notion databases, update Trello boards, read Google Docs — without leaving the conversation.

**Small teams** who want a shared, self-hosted tool server that everyone's AI assistant can connect to, with a simple web UI for managing which integrations are active and who has access.

**Power users** who are already deep in the MCP ecosystem and want a single, well-maintained server that covers the 8-10 integrations they use daily, rather than running a separate MCP server for each one.

## What should the experience feel like?

### First run

A developer hears about Commandable MCP, runs a command, answers 3-4 questions (which integrations? paste your API keys), and gets a config file + a Claude Desktop config snippet they can paste. Total time: 2-3 minutes. They open Claude Desktop, ask it to "list my GitHub repos," and it works.

That moment — "holy shit, it actually works" — is the most important moment in the entire product. Everything else is secondary.

### Daily use

The tool server runs invisibly in the background. The developer doesn't think about it. They just talk to their AI assistant and it can do things: create issues, look up documents, check calendars, update boards. The tools are there when needed and invisible when not.

### Adding a new integration

A developer wants to add Notion. They either:
- Run an npx command again and add it to their config
- Open the local web UI, click "Add Integration," paste their Notion token, done

Either path should take under 60 seconds.

### The management UI

For people who prefer clicking over typing, there's a local web app. It shows which integrations are connected, lets you add/remove them, and provides the MCP config snippet to paste into your client. It's a convenience layer, not a requirement. The CLI does everything the UI does.

## What makes this valuable?

### Integration quality

Each integration ships with a complete manifest of tools — not just "call this API endpoint," but thoughtful, well-described operations that LLMs can actually understand and use correctly. Input schemas are precise. Descriptions are written for AI consumption. Handlers deal with pagination, error cases, and API quirks so the LLM doesn't have to.

### One server, many tools

Instead of running 8 separate MCP servers and managing 8 separate configs, you run one. This matters because every tool you expose to an LLM consumes context window. Having one well-organized server that can present tools intelligently is fundamentally better than 8 dumb ones dumping everything at once.

### Security by default

Credentials are encrypted at rest, even in the local SQLite database. The VM sandbox prevents integration handlers from accessing the filesystem, network, or any globals they shouldn't. Self-hosted means your API keys never leave your machine.

### Open source (AGPL v3)

Anyone can inspect, modify, and self-host. The license ensures that if someone builds a competing hosted service on top of this code, they must open-source their modifications. Individual and team self-hosting is completely unrestricted.

## How does this relate to Commandable (the company)?

Commandable MCP is the open-source project. Commandable (at commandable.ai) is the company that builds and maintains it.

The company also offers:
- **A hosted version** at mcp.commandable.ai — same software, but managed for you. Includes managed OAuth (so you don't have to figure out API keys for services like Google and GitHub), higher usage limits, and team features.
- **An enterprise agent platform** — a full AI agent builder for organizations. The open-source MCP server and the enterprise platform share the same integration engine, so integration quality improvements flow to both.

The open-source project exists to:
- Give developers a genuinely useful tool with no strings attached
- Build trust and awareness for the Commandable brand
- Create a natural upgrade path for users who want managed OAuth, team features, or the full agent platform
- Receive community contributions that improve integrations for everyone

## What's in scope for v1?

- As many integrations as we can ship in a weekend
- stdio MCP transport (works with Claude Desktop, Cursor, Cline, and any local MCP client)
- JSON config file with `env:VAR` support for secrets
- Interactive CLI setup 
- Local web UI for managing integrations and credentials
- SQLite storage (zero external dependencies for self-hosting)
- Encrypted credential storage
- Streamable HTTP transport (planned — needed for remote/hosted access)

## What's explicitly NOT in v1?

- Managed OAuth (planned for hosted version)
- Ability mode / lazy tool loading (planned — important when tool count gets large)
- Docker packaging
- Multi-user / multi-tenant
- Billing / usage limits
