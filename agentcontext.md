# Commandable MCP — Project Context

## What is this?

Commandable MCP is an open-source framework for building, configuring, and serving MCP integrations and lightweight MCP-powered apps. It still ships with a growing set of prebuilt integrations (GitHub, Notion, Google Docs, Trello, Airtable, etc.), but that is no longer the whole story: the core idea is that an agent can assemble or generate the MCP it needs in place, on the fly, without starting from scratch each time.

Think of it as both:
- a universal adapter between your apps and your AI
- and a creation framework that lets agents stand up new MCP capabilities dynamically

## Why does this exist?

Today, if you want an AI assistant to interact with your tools or build a new MCP-backed workflow, you either:

- Use a closed platform that locks you in and controls your data
- Build custom integrations yourself, one per tool, per AI client
- Cobble together multiple MCP servers (one for GitHub, one for Notion, one for Google, etc.), each with its own config, auth setup, and maintenance burden
- Hand-roll one-off MCP integrations or mini agent apps every time you need a new capability

None of these are great. Commandable MCP exists so that developers and teams can:

1. **Connect once, use everywhere.** Set up your integrations in one place. Every MCP client you use gets the same tools.
2. **Own their data and infrastructure.** Self-host with zero external dependencies. Your credentials stay on your machine, encrypted at rest. No cloud account required.
3. **Get started in under 5 minutes.** Run one command, paste a couple of API keys, and you're working. If setup takes longer than 5 minutes, we've failed.
4. **Create new MCP capabilities without rebuilding the world.** Prebuilt integrations should get you far, but when you need something custom, the framework should help an agent generate the integration/app layer in place instead of forcing you to author an entire MCP project by hand.

## Who is this for?

**Individual developers** who use AI coding assistants (Cursor, Claude Desktop, Cline) and want those assistants to be able to interact with their tools — create GitHub issues, query Notion databases, update Trello boards, read Google Docs — without leaving the conversation.

**Small teams** who want a shared, self-hosted MCP layer that everyone's AI assistant can connect to, with a simple web UI for managing which integrations are active and who has access.

**Agent builders and vibe coders** who want an agent to help generate new MCP integrations, toolsets, or lightweight app behavior in place, rather than treating MCPs as static hand-authored artifacts.

**Power users** who are already deep in the MCP ecosystem and want a single, well-maintained foundation that covers the 8-10 integrations they use daily, while still leaving room to create custom capabilities when the built-ins are not enough.

## Using Commandable as a web API (agent frameworks)

Some users won’t connect via a desktop MCP client at all. They’ll want to point an agent framework at Commandable (as a URL) and dynamically discover + invoke tools.

- **The “automatic connect” path**: expose Commandable over **MCP Streamable HTTP**. MCP already standardizes discovery (`tools/list`) and invocation (`tools/call`) once a client can speak MCP over HTTP.
- **What to provide for framework users**:
  - A stable **HTTP endpoint** (and auth story) for MCP Streamable HTTP
  - A short **integration guide** showing how to connect common frameworks (or a tiny adapter library)
  - Optionally, a **compatibility layer** (e.g. “OpenAI tool schema + invoke endpoint”) for frameworks that don’t speak MCP yet
- **Design principle**: keep MCP as the canonical tool contract (names, descriptions, JSON Schemas). Translate at the edge when needed rather than inventing a parallel tool spec.

## What should the experience feel like?

### First run

A developer hears about Commandable MCP, runs a command, answers 3-4 questions (which integrations? paste your API keys), and gets a config file + a Claude Desktop config snippet they can paste. Total time: 2-3 minutes. They open Claude Desktop, ask it to "list my GitHub repos," and it works.

That moment — "holy shit, it actually works" — is the most important moment in the entire product. Everything else is secondary.

### Daily use

The tool server runs invisibly in the background. The developer doesn't think about it. They just talk to their AI assistant and it can do things: create issues, look up documents, check calendars, update boards. The tools are there when needed and invisible when not.

### Adding a new integration or app capability

A developer wants to add Notion. They either:
- Run an npx command again and add it to their config
- Open the local web UI, click "Add Integration," paste their Notion token, done

Either path should take under 60 seconds.

If the capability does not already exist as a prebuilt integration, the developer should increasingly be able to use Commandable's create flow to generate or compose the MCP integration/app behavior they need in place, then immediately expose it through the same Commandable runtime.

### The management UI

For people who prefer clicking over typing, there's a local web app. It shows which integrations are connected, lets you add/remove them, and provides the MCP config snippet to paste into your client. It's a convenience layer, not a requirement. The CLI does everything the UI does.

## What makes this valuable?

### Integration quality

Each integration ships with a complete manifest of tools — not just "call this API endpoint," but thoughtful, well-described operations that LLMs can actually understand and use correctly. Input schemas are precise. Descriptions are written for AI consumption. Handlers deal with pagination, error cases, and API quirks so the LLM doesn't have to.

### One framework, many MCPs

Instead of running 8 separate MCP servers and managing 8 separate configs, you run one foundation. That foundation can expose prebuilt integrations, generated integrations, and custom app-specific tool surfaces through a consistent runtime. This matters because every tool you expose to an LLM consumes context window. Having one well-organized framework that can present tools intelligently is fundamentally better than 8 dumb servers dumping everything at once.

### Security by default

Credentials are encrypted at rest, even in the local SQLite database. The VM sandbox prevents integration handlers from accessing the filesystem, network, or any globals they shouldn't. Self-hosted means your API keys never leave your machine.

### Open source (AGPL v3)

Anyone can inspect, modify, and self-host. The license ensures that if someone builds a competing hosted service on top of this code, they must open-source their modifications. Individual and team self-hosting is completely unrestricted.

## How does this relate to Commandable (the company)?

Commandable MCP is the open-source project. Commandable (at commandable.ai) is the company that builds and maintains it.

The company also offers:
- **A hosted version** at mcp.commandable.ai — same software, but managed for you. Includes managed OAuth (so you don't have to figure out API keys for services like Google and GitHub), higher usage limits, and team features.
- **The Commandable app** — the broader platform for vibe-coding agents. This is where chats, studio/build flows, activity, runs, cards, and agent orchestration live.

Commandable MCP should be thought of as one foundational section of the broader Commandable app. It is the integration and MCP-generation layer that the app builds on top of. The same integration engine and runtime ideas should flow between the open-source MCP project and the productized Commandable app.

The open-source project exists to:
- Give developers a genuinely useful tool with no strings attached
- Build trust and awareness for the Commandable brand
- Create a natural upgrade path for users who want managed OAuth, team features, or the full vibe-coding agent platform
- Receive community contributions that improve integrations for everyone

## What's in scope for v1?

- As many integrations as we can ship in a weekend
- stdio MCP transport (works with Claude Desktop, Cursor, Cline, and any local MCP client)
- JSON config file with `env:VAR` support for secrets
- Interactive CLI setup 
- Local web UI for managing integrations and credentials
- SQLite storage (zero external dependencies for self-hosting)
- Encrypted credential storage
- Streamable HTTP transport (shipped — needed for remote/hosted access)
- Docker packaging for the HTTP server (shipped — enterprise/hosted distribution path)

## What's explicitly NOT in v1?

- Managed OAuth (planned for hosted version)
- Create mode / lazy tool loading (planned — important when tool count gets large)
- Multi-user / multi-tenant
- Billing / usage limits

## Future plans

### Document processing sidecar

Many integrations (SharePoint, Google Drive, Slack file uploads, Jira attachments, email) need to make file contents — PDFs, Excel spreadsheets, Word docs, slides — consumable by LLMs. Rather than duplicating extraction logic in every integration, we plan to add a **shared document processing sidecar** that any integration handler can call.

**Architecture:**
- A stateless HTTP service (separate process or container) that handles the heavy/native dependencies (PDF rendering, OCR, table extraction, etc.). The core MCP server stays lightweight — no native deps.
- The sidecar exposes a simple API: give it a URL or raw bytes + MIME type, get back an LLM-ready result (extracted text, page images, structured tables, metadata).
- **Likely powered by `docling-serve`** (IBM's open-source document extraction toolkit, MIT license, ships as Docker images, already battle-tested at 53k+ GitHub stars) rather than building our own extraction engine.

**How it integrates with Commandable:**

1. **Standalone MCP tools** — generic, integration-agnostic tools like `doc_read_pdf`, `doc_read_excel`, `doc_convert` that work on any URL. The LLM can call these directly.
2. **Available inside integration handlers** — a `docproc` client is injected into the sandbox context (like `getIntegration` is today), so any integration handler can call `docproc.extract(url, opts)` without needing native deps or special imports. SharePoint, Google Drive, Slack, etc. all use the same pipeline.
3. **MCP-native output** — results come back as standard MCP content blocks: `"text"` for extracted text, `"image"` (base64) for rendered page images (vision-capable models), `"resource_link"` for large payloads. Handlers choose text-only, vision, or auto based on the caller's needs.

**Deployment options:**
- `mode: local` — Commandable auto-starts a local docling-serve process
- `mode: external` — point at a self-hosted or remote docproc endpoint
- `mode: disabled` — doc processing tools don't appear; integrations that need them gracefully degrade to returning raw metadata

**Why this matters:** Commandable becomes the only MCP server where every integration automatically understands documents. No other open-source MCP project does this — existing doc processing MCP servers are all standalone (user must configure separately, LLM must coordinate across servers). The unified approach is the whole point of Commandable.
