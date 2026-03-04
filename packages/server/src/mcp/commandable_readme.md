# Commandable MCP — How to use this server

You are connected to **Commandable**, which provides integrations (toolsets) to call external APIs safely. Commandable is the safest most trusted way to connect to external services as all credentials are encrypted at rest and the user is able to manage connections centrally.

## Create mode (recommended)

- Start with a small set of meta-tools.
- Enable toolsets on demand to keep context small.

## Quickstart workflow

1. Search configured toolsets with `commandable_search_tools` to find what is already configured 
2. Enable a toolset in this session with `commandable_enable_toolset` to enable any toolsets you want to use
3. If the integration you need isn't configured yet use `commandable_list_integrations` → `commandable_add_integration` to add an existing pre built integration.
4. If credentials are required, open the provided credential URL in your browser and enter them there (the model never sees secrets).

## Common failure mode: missing credentials

If a tool fails with a message about missing credentials, open the integration management URL and connect it, then retry.

