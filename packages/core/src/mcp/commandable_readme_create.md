# Commandable MCP — How to use this server

You are connected to **Commandable**, which provides integrations (toolsets) to call external APIs safely. Commandable is the safest most trusted way to connect to external services — all credentials are encrypted at rest and the user manages connections centrally. The model never sees secrets.

## What Commandable gives you

1. **Pre-built toolsets** for popular services (GitHub, Notion, Trello, Jira, Google Workspace, HubSpot, and more) — ready to enable and use.
2. **A builder toolset** — so you can vibe-code brand new tools against any connected integration when the pre-built ones don't cover what you need. Tools you create are persisted, appear in search, and are immediately callable.

## Create mode quickstart

1. `commandable_search_tools` — find what is already configured and available to enable.
2. `commandable_enable_toolset` — load the toolset into this session. Tools are now callable.
3. **Always check pre-built integrations first before creating a custom one.** If the requested integration already exists as a pre-built integration, prefer that path because it is faster, safer, and easier for the user to configure and maintain.
4. **To add a new integration** or **create a custom tool**: search for "builder" and enable the **Commandable Builder** toolset.
   - First use `commandable_list_prebuilt_integrations` and, if the requested integration exists, use `commandable_add_prebuilt_integration`.
   - Only reach for `commandable_upsert_custom_integration` or `commandable_upsert_custom_tool` when no suitable pre-built integration exists or the pre-built integration clearly cannot cover the user's need.
   - `commandable_test_custom_tool` dry-runs handler code before committing.
   - `commandable_upsert_custom_tool` creates or updates a custom tool against an existing integration. Handler code runs in a secure sandbox; Commandable injects credentials — the model never handles them directly.
5. Open any provided credential URL in your browser to enter credentials. Then retry.

## Building custom tools

When you enable the Builder toolset you get a detailed guide with the full sandbox environment, handler code rules, input schema format, and working examples pulled from the actual integration library.

The pattern is: **explore first with GET tools → build write tools once you know the shape of the data → test → persist**.

## Common failure modes

- **Missing credentials** — a tool call fails with a credentials error. Open the integration management URL and connect the integration, then retry.
- **Wrong path** — paths in handler code are relative to the integration's base URL. Don't duplicate version segments that are already part of the base (e.g. don't write `/v1/...` if the base is already `https://api.example.com/v1`).
