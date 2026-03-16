# Commandable MCP — Dynamic Mode

You are connected to **Commandable** in dynamic mode. Toolsets are loaded on demand to keep your context lean.

## What Commandable gives you

Pre-built toolsets for popular services (GitHub, Notion, Trello, Jira, Google Workspace, HubSpot, and more) — ready to search, enable, and use.

## Quickstart

1. `commandable_search_tools` — find toolsets available to enable (e.g. search "github", "trello", "notion").
2. `commandable_enable_toolset` — load a toolset into this session. Its tools become callable immediately.
3. Use the tools. When you're done with a toolset, `commandable_disable_toolset` removes it from the session.

## How it works

- Tools are organised into **toolsets** — small bundles grouped by integration and function (e.g. `github__issues`, `trello__all_tools`).
- Enabling a toolset registers its tools in this session and triggers a `tools/list_changed` notification so the client picks them up.
- Disabling a toolset removes its tools from the session.
- Toolsets are scoped to this session only — they don't affect other sessions or users.

## Other features 

Commandable also provides a create mode - where connected agents can add new integrations and connections in place. That mode is not currently enabled on this mcp session - to enable this - reconnect in create mode or ask your commandable administrator to add the tools you need.
