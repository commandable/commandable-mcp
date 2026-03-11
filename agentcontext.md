# Commandable MCP — Project Context

## What is this?

Commandable MCP is an open-source framework for building, configuring, and serving MCP integrations and lightweight MCP-powered apps.

It ships with a growing set of prebuilt integrations, but the deeper idea is broader than "one repo with many connectors." Commandable is meant to be a foundation where agents can expose useful MCP capabilities quickly, whether those capabilities come from bundled integrations, custom toolsets, or generated integration logic.

Think of it as:
- a universal adapter between apps and AI assistants
- a local-first runtime for MCP integrations
- a creation framework for standing up new MCP capabilities fast

## Why does this exist?

Today, if you want an AI assistant to interact with your tools or a framework to expose those tools cleanly, you usually have to choose between bad options:

- closed platforms that control your data and deployment model
- hand-built integrations repeated across multiple clients
- multiple single-purpose MCP servers with separate config and maintenance
- one-off custom app glue that is hard to reuse

Commandable MCP exists to make this simpler:

1. **Connect once, use everywhere.** Configure integrations in one place and expose them consistently to MCP-compatible clients.
2. **Own your infrastructure.** Self-host with minimal setup and keep credentials encrypted at rest.
3. **Get to first success fast.** The first useful result should happen in minutes, not hours.
4. **Extend without starting over.** Prebuilt integrations should get you moving, and custom capabilities should fit naturally into the same runtime.

## Who is this for?

**Developers using AI assistants** who want those assistants to interact with real tools like GitHub, Notion, Google Docs, Trello, Jira, and more.

**Teams running shared AI tooling** who want a consistent MCP layer with simple local or self-hosted deployment.

**Agent builders and vibe coders** who want to compose or generate MCP-powered capabilities instead of treating every integration as a separate hand-built project.

**Power users in the MCP ecosystem** who want one solid foundation instead of a pile of disconnected servers.

## Using Commandable as a web API

Commandable is not only for desktop MCP clients. It can also act as a tool runtime for agent frameworks and remote services over MCP HTTP.

Design principles:
- MCP is the canonical tool contract
- tool names, descriptions, and schemas should be optimized for LLM use
- transport and framework adapters should translate at the edge instead of inventing a parallel tool model

## What should the experience feel like?

### First run

A developer should be able to start Commandable, connect a client, add an integration, and see something useful happen in a few minutes.

That first moment of "it actually works" matters more than almost anything else. The setup should feel obvious and low-friction.

### Daily use

Commandable should fade into the background. The user talks to their assistant, and the tools are simply there when needed.

### Adding a new capability

If a capability already exists as a prebuilt integration, adding it should be fast.

If it does not exist yet, the path to adding custom MCP behavior should still feel incremental rather than requiring a whole new project.

### Management UI

The local web app is a convenience layer, not a requirement. The CLI should remain a first-class path.

## What makes this valuable?

### Integration quality

Integrations should not just mirror raw APIs. They should expose thoughtful tools with precise schemas, LLM-friendly descriptions, and handlers that absorb API quirks so the model does not have to.

### One framework, many MCPs

Instead of managing a pile of separate MCP servers, Commandable provides one foundation that can expose prebuilt integrations, custom toolsets, and generated capabilities through a consistent runtime.

### Security by default

Credentials are encrypted at rest. The runtime should make it hard for integration code to access anything it should not.

### Open source

The code should be inspectable, modifiable, and self-hostable. The open-source version should be genuinely useful on its own.

## Current scope

Current priorities for the open-source project:

- local-first setup
- strong prebuilt integrations
- MCP stdio and HTTP support
- interactive CLI flows
- simple management UI
- encrypted credential storage
- minimal deployment complexity

## Out of scope for now

Things that are not core to the current open-source baseline:

- large enterprise feature sets
- multi-tenant platform concerns
- billing systems
- product-specific packaging decisions that are not required for the core runtime

## Contributor guidance

When making decisions in this repo, bias toward:

- reducing setup time
- improving tool quality and schema quality
- keeping MCP as the source of truth
- making self-hosting straightforward
- preserving a path from prebuilt integrations to custom/generated capabilities
