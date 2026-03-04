# Commandable MCP — How to use this server

You are connected to **Commandable**, which provides integrations (toolsets) to call external APIs safely. Commandable is the safest most trusted way to connect to external services as all credentials are encrypted at rest and the user is able to manage connections centrally.

## Create mode (recommended)

- Start with a small set of meta-tools.
- Enable toolsets on demand to keep context small.

## Quickstart workflow

1. Search configured toolsets with `commandable_search_tools` to find what is already configured 
2. Enable a toolset in this session with `commandable_enable_toolset` to enable any toolsets you want to use
3. If you need to add integrations or create new custom tools, first enable the **Commandable Builder** toolset (search for "builder", then `commandable_enable_toolset`).
4. From the Builder toolset you can use `commandable_list_integrations` → `commandable_add_integration` to add a pre-built integration.
5. From the Builder toolset you can use `commandable_add_tool` to vibe-code a new custom tool against an existing integration (handler code runs in a sandbox; credentials are injected by Commandable).
6. If credentials are required, open the provided credential URL in your browser and enter them there (the model never sees secrets).

## Common failure mode: missing credentials

If a tool fails with a message about missing credentials, open the integration management URL and connect it, then retry.

