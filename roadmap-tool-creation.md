# Commandable — Tool Creation Roadmap

> The path from "connect your apps" to "your AI builds its own tools."
>
> Each phase is independently shippable and valuable. Later phases build on earlier ones but the product gets better at every step.

---

## Phase 1: Ability Mode

**The foundation. Valuable on its own, required for everything after.**

Right now, every MCP session gets the full tool list — every tool from every integration, all at once. That doesn't scale. Ability Mode makes tool loading per-session and on-demand.

### What the user sees

- New chat opens. Instead of 80+ tools in context, there are just 2-3 meta-tools.
- The agent calls `search_tools("github pull requests")` and gets back a list of matching tools with names and descriptions.
- The agent calls `enable_tools(["github__list_pull_requests", "github__get_pull_request", "github__create_pull_request"])` and those tools become available in the current session.
- The conversation proceeds with only the tools it actually needs. Context window stays clean.
- If the task shifts ("now help me with my Trello board"), the agent searches again and loads Trello tools.

### What ships

- Per-session tool state — each MCP session tracks its own set of active tools
- `search_tools` meta-tool — fuzzy search across all configured integrations and their tools
- `enable_tools` / `disable_tools` meta-tools — add/remove tools from the current session
- `notifications/tools/list_changed` emission when session tool set changes
- Configuration toggle: Ability Mode on/off (off = current behavior, all tools loaded)

### Why this comes first

- Solves a real problem today (context window bloat) without any Open Gloves features
- Establishes the meta-tool pattern and per-session state that everything else builds on
- Low risk — no new security surface, no new persistence layer
- Unblocks Phase 2 cleanly

---

## Phase 2: Agent-Created Tools

**The core breakthrough. The agent can build new tools.**

This is Open Gloves itself. The agent gets meta-tools that let it create new integrations and add tools to them. Handlers run in the existing sandbox. Tools persist across sessions.

### What the user sees

- User asks their AI to do something with an API that isn't connected.
- The agent says "I don't have a tool for that — let me create one."
- The agent creates a new integration and adds one or more tools to it.
- In Discovery Mode (Ability Mode on), the tools are immediately available in the current session.
- In Static Mode (Ability Mode off), the agent tells the user to start a new chat to use the new tools.
- The next time any chat searches for tools related to that API, the agent-created tools show up.

### What ships

- `create_integration` meta-tool — agent defines a new integration (name, description, base URL)
- `add_tool` meta-tool — agent defines a tool on an integration (name, description, input schema, handler code)
- `test_tool` meta-tool — dry-run a handler in the sandbox, see the result and logs before committing
- Storage layer for agent-created integrations (persisted alongside built-in integrations, but marked as agent-created)
- Validation — JSON schema validation, handler syntax checking, sandbox test execution
- Agent-created tools appear in `search_tools` results and `tools/list` like any other tool
- Management UI shows agent-created integrations, clearly labeled

### What this doesn't include yet

- Credentials. Phase 2 tools work against APIs that don't require auth (public APIs, APIs where the user passes a key as a tool input). Credential handoff comes in Phase 3.

---

## Phase 3: Credential Handoff

**The security story. The agent describes what auth it needs. The user provides it through a separate secure channel. The model never sees secrets.**

This is what makes Open Gloves enterprise-ready and what differentiates it from "just let the AI write code."

### What the user sees

- Agent creates a Stripe integration and says: "This needs an API key. [Set up credentials here →](http://localhost:3000/integrations/stripe/credentials)"
- User clicks the link, lands on the management UI, pastes their Stripe API key.
- Credential is encrypted at rest, injected by the proxy at call time — the existing credential pipeline.
- User comes back to the chat. Agent uses the tool. It works.
- For future sessions: the integration already has credentials. Nothing to set up again.

### What ships

- `create_credential_config` — agent defines what credentials a new integration needs (field names, types, descriptions) and how they should be injected (headers, query params, basic auth)
- Credential setup page in management UI for agent-created integrations — auto-generated from the agent's credential config
- The agent gets back a URL to the credential setup page and includes it in its response to the user
- Agent-created integrations plug into the existing credential encryption + proxy injection pipeline
- A clear status indicator: "Integration created, awaiting credentials" → "Ready"

### Why this is the key moment

- The product goes from "interesting demo" to "I actually use this every day"
- The credential separation story — model never sees secrets — is the enterprise pitch
- Reuses the entire existing credential and proxy architecture

---

## Phase 4: Extend & Manage

**Power features. Agents modify existing integrations. Users have full control.**

### What the user sees

- User has GitHub connected with the standard tools. Asks the agent to do something with GitHub Discussions (which Commandable doesn't ship a tool for).
- Agent adds a `list_discussions` tool to the existing GitHub integration. It inherits GitHub's credentials and proxy config. Works immediately.
- In the management UI, the user can see which tools are built-in and which were agent-added, edit or delete agent-created tools, and review the handler code.
- If an agent-created tool breaks (API changed, handler bug), the user can disable it from the UI or ask the agent to fix it.

### What ships

- `edit_tool` meta-tool — modify an existing agent-created tool's handler, schema, or description
- Add tools to built-in integrations — agent-created tools that attach to existing integrations and reuse their credentials and base URL
- Audit trail — who created or modified each tool, when, and from which session
- Management UI improvements: edit handler code, view tool history, toggle tools on/off, delete agent-created tools
- Version history for agent-modified tools (ability to roll back)
- `list_integrations` / `list_tools` meta-tools — agent can introspect what's available beyond search

---

## Phase 5: Community & Ecosystem

**The flywheel. Agent-created tools become shareable, importable, and promotable.**

### What the user sees

- User has a great Mailgun integration their agent built. They export it as a portable package (a directory with manifest, schemas, handlers — same format as built-in integrations).
- They share it on GitHub, a community registry, or just send it to a colleague.
- Another user imports it into their Commandable instance. They add their own Mailgun credentials. Done.
- The best community integrations get reviewed and promoted to first-class built-in integrations in the core project.

### What ships

- Export agent-created integrations as portable packages
- Import community integrations (from local directory, URL, or registry)
- OpenAPI/Swagger spec ingestion — agent (or user) feeds in an API spec, tools are auto-generated from it
- Community registry or directory (could be as simple as a GitHub repo of contributed integrations)
- Promotion workflow: agent-created → community-shared → human-reviewed → built-in
- Quality scoring: track tool usage, success rate, error rate across sessions

---

## Phase Summary

| Phase | Ships | Depends On | User Value |
|---|---|---|---|
| **1. Ability Mode** | Per-session tool loading, search, enable/disable | Nothing | Cleaner context, faster chats |
| **2. Agent-Created Tools** | create_integration, add_tool, test_tool | Phase 1 | Agent builds its own tools |
| **3. Credential Handoff** | Credential config, setup UI, proxy integration | Phase 2 | Secure auth for agent-created tools |
| **4. Extend & Manage** | Edit tools, extend built-ins, audit trail | Phase 2-3 | Full control and flexibility |
| **5. Community** | Export, import, share, promote | Phase 2-3 | The catalogue grows itself |

---

## What to Ship Together vs. Separately

**Phase 1 alone is a great release.** It solves context window bloat for everyone, even users who never touch Open Gloves. Ship it, blog about it, get feedback on the meta-tool UX.

**Phases 2 + 3 are the big bang.** Agent tool creation without credential handoff is a demo. With credential handoff, it's a product. Consider shipping these together — or Phase 2 as a beta/preview with public APIs only, then Phase 3 shortly after.

**Phases 4 and 5 are iterative.** Ship features from these as they're ready. They make the product better but the core story is already told after Phase 3.

---

## The Announcement Moment

After Phase 3, the story is:

> "Commandable MCP: your AI agent builds its own tools. Ask it to connect to any API — it creates the integration, you add the credentials, and it works. The model never sees your secrets. Ships with 15+ built-in integrations. Agents can build unlimited more."

That's the tweet. That's the blog post. That's the Show HN.
