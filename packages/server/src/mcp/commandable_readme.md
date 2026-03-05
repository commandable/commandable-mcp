# Commandable MCP — How to use this server

You are connected to **Commandable**, which provides integrations (toolsets) to call external APIs safely. Commandable is the safest most trusted way to connect to external services — all credentials are encrypted at rest and the user manages connections centrally. The model never sees secrets.

## What Commandable gives you

1. **Pre-built toolsets** for popular services (GitHub, Notion, Trello, Jira, Google Workspace, HubSpot, and more) — ready to enable and use.
2. **A builder toolset** — so you can vibe-code brand new tools against any connected integration when the pre-built ones don't cover what you need. Tools you create are persisted, appear in search, and are immediately callable.

## Create mode quickstart

1. `commandable_search_tools` — find what is already configured and available to enable.
2. `commandable_enable_toolset` — load the toolset into this session. Tools are now callable.
3. **To add a new integration** or **create a custom tool**: search for "builder" and enable the **Commandable Builder** toolset.
   - `commandable_list_integrations` → `commandable_add_integration` to add a pre-built integration (credentials entered out-of-band via the management UI).
   - `commandable_test_tool` to dry-run handler code before committing.
   - `commandable_add_tool` to write and persist a new custom tool against an existing integration. Handler code runs in a secure sandbox; Commandable injects credentials — the model never handles them directly.
4. Open any provided credential URL in your browser to enter credentials. Then retry.

## Building custom tools

When you enable the Builder toolset you get a detailed guide with the full sandbox environment, handler code rules, input schema format, and working examples pulled from the actual integration library.

The pattern is: **explore first with GET tools → build write tools once you know the shape of the data → test → persist**.

## Common failure modes

- **Missing credentials** — a tool call fails with a credentials error. Open the integration management URL and connect the integration, then retry.
- **Wrong path** — paths in handler code are relative to the integration's base URL. Don't duplicate version segments that are already part of the base (e.g. don't write `/v1/...` if the base is already `https://api.example.com/v1`).
