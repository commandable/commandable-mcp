# "IpOpen Gloves — Requirements & Vision

> Working title. May ship as a core feature of Commandable MCP, or as a standalone companion project (commandable/open-gloves). The name doesn't matter yet. The idea does.

---

## The One-Liner

**Open Gloves lets your AI agent build its own tools — safely — so you never have to wait for someone to ship an integration.**

---

## Press Release (Amazon-style)

### "Commandable Launches Open Gloves: Any AI Agent Can Now Build and Use Its Own Tools"

**FOR IMMEDIATE RELEASE**

Today, Commandable announces Open Gloves, an open-source framework that lets AI agents create, modify, and use their own tool integrations on the fly — without ever touching credentials, without escaping a security sandbox, and without requiring a single line of code from the user.

Until now, connecting an AI assistant to a new app meant waiting for someone to build an integration, or building one yourself. If your favorite API wasn't supported, you were stuck. Open Gloves removes that bottleneck entirely. When a user asks their AI to "check my Stripe balance" or "look up this flight on Amadeus," the agent doesn't fail with "I don't have that tool." Instead, it *builds* the tool, right there in the conversation — then uses it.

"The integrations we ship are table stakes," said Theo McCabe, founder of Commandable. "The real unlock is that the agent can build whatever it needs. We just give it hands."

**How it works for the user:**

1. You set up Commandable MCP as you always have — connect your apps, paste your keys.
2. You enable Agent Tool Creation.
3. You talk to your AI. When it needs a tool that doesn't exist, it creates one.
4. If the new tool needs credentials (an API key, an OAuth token), the agent sends you a link to the Commandable management UI where you securely enter them. The AI never sees the credentials.
5. The tool is live. It works in this conversation and every conversation after.

**What makes this different from "just letting the AI write code":**

- The agent's tools run in a sandboxed environment. They can make API calls through a controlled proxy and nothing else. No filesystem access, no arbitrary code execution, no network escape.
- Credentials are managed entirely outside the AI's context. The model provider never sees your API keys. Enterprise IT can own the credential layer while users generate tools freely.
- Tools persist. Once an agent builds a Stripe integration, every future conversation has Stripe tools available. You're not rebuilding from scratch each time.

Open Gloves is available today as part of Commandable MCP (open source, AGPL v3).

---

## The Problem

People want their agents to be able to do for them things. They want this to happen securely. They want set up to be as easy as possible. 

## The Insight

Commandable already runs tool handlers in a secure sandbox. The handlers are small — typically 5-15 lines of JavaScript that call an API through a proxy. An LLM can write these trivially. The JSON schemas that describe tool inputs are exactly the kind of structured output LLMs excel at generating.

So: **the agent already has everything it needs to build its own tools.** We just need to give it permission.

The second insight is about credentials. The sandbox architecture means tool handlers never see raw credentials — they call `integration.fetch()` and the proxy layer injects auth headers. This means an agent can *create* a tool and *describe* what credentials it needs, without ever having access to the credentials themselves. The user provides credentials through a separate, secure UI. The LLM and the model provider are completely out of the loop.

**This is the architectural separation that makes the whole thing safe.**

## The Aha Moment

A developer is talking to Claude in Cursor. They're working on a project that uses the Mailgun API. They say:

> "Send a test email via Mailgun to confirm the signup flow works."

Today, Claude says: "I don't have access to Mailgun."

With Open Gloves, Claude says:

> "I don't have a Mailgun integration yet. Let me create one."

The agent builds a Mailgun integration — a `send_email` tool with the right schema — and registers it. Then it says:

> "I've created a Mailgun integration. It needs an API key and domain. [Set up credentials here →](http://localhost:3000/integrations/mailgun/credentials)"

The developer clicks the link, pastes their Mailgun API key, and comes back. Claude sends the test email. The whole thing takes 45 seconds.

Next week, the developer asks Claude to check bounce rates. Claude adds a `get_bounces` tool to the existing Mailgun integration, reusing the same credentials. No setup needed.

**That's the aha moment: the AI just gave itself hands. With Security Protection Gloves.**

## How It Works (User Perspective)

### Setup

You install and configure Commandable MCP or "Open Gloves" depending on the name we choose as normal. Integration Creaton and Tool Creation are capabilities you can enable or disable. When enabled, the connected AI agent has access to a set of meta-tools that let it manage integrations.

There are two operating modes:

**Read mode** (default) — All configured tools are loaded at startup. Over HTTP this is served at `/mcp`. This works with every MCP client today. Best for: day-to-day usage with Claude Desktop, Cursor, and other clients.

**Create mode** — Per-session dynamic tool loading via meta-tools (`commandable_search_tools`, `commandable_enable_toolset`, `commandable_disable_toolset`). Over HTTP this is served at `/mcp/create`; over stdio it remains the `create-mode` flow. The agent discovers and enables only the toolsets it needs. When agent tool creation is enabled, new tools are immediately available in the same conversation. Best for: building and configuring integrations with Claude Code or other clients that support `notifications/tools/list_changed`.

### The User Journey

**1. "I need a tool that doesn't exist"**

The user asks their AI to do something that requires an API Commandable doesn't have an integration for. The agent recognizes it doesn't have the right tool and decides to build one.

**2. The agent creates the integration**

Using the Open Gloves meta-tools, the agent creates a new integration: defines the tools, their inputs, and the handler logic. The agent can look up API documentation (if it has web access) or work from its training knowledge.

**3. Credentials handoff**

If the new integration needs authentication, the agent specifies what credentials are required (e.g., "an API key" or "a bearer token and a workspace ID"). It then provides the user with a link to the Commandable management UI where they can securely enter those credentials.

This is the critical UX moment: **the agent tells you what it needs, but you provide it through a separate secure channel.** The model provider never sees the credentials. They're encrypted at rest, injected by the proxy layer at call time.

**4. The tool is live**

In create mode, the tool is immediately available. In read mode, the user reconnects. Either way, the agent can now use the tool — and so can any future conversation.

**5. Extending existing integrations**

The user already has GitHub connected. They ask the agent to do something the existing GitHub tools don't cover — say, managing GitHub Discussions. The agent adds a new tool to the existing GitHub integration, reusing the same credentials and proxy config. No new setup required.

### What the User Controls

- **Enable/disable Open Gloves entirely.** Some users or environments won't want agents creating tools.
- **Read-only vs. full access.** You can allow agents to create new integrations, or only extend existing ones, or only use what's already there.
- **Credential approval.** The user always controls the credential step. An agent can say "I need a Mailgun API key" but it cannot conjure one. The human is always in the loop for secrets.
- **Review and audit.** The management UI shows all agent-created integrations, who created them, and what they do. IT teams can review, approve, or remove tools.

## Usage Patterns

### Pattern 1: The Power User

A developer working across many APIs throughout the week. Monday it's Stripe, Tuesday it's Twilio, Wednesday it's an internal REST API. Instead of configuring integrations upfront, they let the agent build what's needed as they go. Their Commandable instance accumulates a personal toolkit shaped by their actual work.

### Pattern 2: The Enterprise Team

IT owns the Commandable deployment and manages credentials. Developers are allowed to create tools against pre-approved integrations (e.g., the company's internal APIs) but can't add new credential configurations. The agent can build tools, but only for services IT has already blessed. Separation of concerns: IT controls access, developers control capability.

### Pattern 3: The Hobbyist / Tinkerer

Someone connecting their AI to their smart home API, their local NAS, a niche SaaS product with 500 users. These integrations will never be built by a vendor. Open Gloves means the long tail of APIs is covered by default.

### Pattern 4: The Agent Framework

A backend agent (LangChain, CrewAI, AutoGen, or whatever) is connected to Commandable over HTTP. During a multi-step task, it realizes it needs to interact with an API it hasn't used before. It creates the integration programmatically, provides credentials through the API (or prompts a human operator), and continues the task. No human-in-the-loop needed for the tool creation itself — only for the credential step.

### Pattern 5: Community-Driven Growth

An agent creates a Mailgun integration. The user likes it. They export it and share it — now it's a community-contributed integration that anyone can import. The best agent-created integrations get promoted to first-class, human-reviewed integrations in the core project. **The community grows the integration catalogue organically, without anyone writing traditional code.**

## Why This Matters

### For individual developers

You'll never be blocked by a missing integration again. Your AI assistant becomes self-sufficient. The tool catalogue is infinite.

### For teams and enterprises

The separation between credentials and tools is exactly what security teams want. IT manages the keys. Developers (and their agents) build the tools. Audit trails show who created what and when. It's the right division of responsibility.

### For the AI ecosystem

Today, tool use is limited by human effort — someone has to build each integration. Open Gloves inverts that. The AI builds its own tools, humans just approve the permissions. This is how tool-use should work at scale.

### For Commandable as a product

The pre-built integrations become a trust signal and a quality floor, not a ceiling. "We ship 15 integrations, but agents can build unlimited more" is a fundamentally different story than "we ship 15 integrations." It moves Commandable from "another MCP server" to "the platform where agents equip themselves."

## What This Is Not

- **Not an agent framework.** We don't run the agent. We don't do planning, memory, or multi-step orchestration. We provide tools to whatever agent the user is already running. We're the hands, not the brain.
- **Not arbitrary code execution.** Agent-generated tools run in the same restricted sandbox as all other tools. They can make HTTP calls through the proxy. That's it.
- **Not a security risk with credentials.** The entire point is that credentials flow through a separate, user-controlled channel. The AI describes what auth is needed; the human provides it through the UI; the proxy injects it at runtime. The model never sees secrets.

## Open Questions

- **Should agent-created integrations be first-class citizens or marked as "agent-generated"?** Probably marked, with a path to promote them.
- **How do we handle API documentation?** If the agent has web access, it can read API docs. If not, it works from training data. Should we provide a way to feed API specs (OpenAPI/Swagger) directly?
- **What's the right default?** Open Gloves on by default (maximum wow factor) or off by default (maximum caution)?
- **How do we handle versioning of agent-created tools?** If the agent updates a handler, do we keep history?
- **Rate limiting / quotas?** Should there be limits on how many tools an agent can create?

---

## README Update Plan

The current README focuses on "connect your apps to AI via MCP." The updated README should tell a bigger story:

### New narrative arc:

1. **Hook**: "The universal tool server for AI agents — with the integrations you need, and the ones you haven't thought of yet."
2. **What it does (existing)**: Connect GitHub, Notion, Google, etc. to any MCP-compatible AI client. One server, many tools.
3. **The twist (Open Gloves)**: Your AI agent can also build its own integrations. Ask it to connect to any API, and it will — safely, inside a sandbox, without ever seeing your credentials.
4. **How it works**: Three-step quick start, same as today. Mention Open Gloves as a capability you get for free.
5. **The security story**: Emphasize the credential separation model. "Your API keys never touch the AI. Not the model, not the provider, not the conversation."
6. **Two audiences**: Individual developers ("your AI just got hands") and teams/enterprise ("IT owns the keys, agents build the tools").

### Sections to add:

- **"Agent-Created Integrations"** — short section explaining Open Gloves, the aha moment, and how it works from the user perspective
- **"Security Model"** — promote the credential separation story from a paragraph to a proper section
- **"For Enterprise"** — brief pitch on the credential/tool separation as enterprise-grade access control

### Sections to update:

- **Hero description** — broaden from "connects your apps" to "gives your AI hands"
- **"Why Commandable?"** — add "infinite integrations" as a differentiator alongside the existing points
- **Integration list** — reframe as "ships with X integrations, agents can build unlimited more"

---

## Pre-Mortem: How This Could Fail

### "The agent builds bad tools"

Agent-generated handlers might be buggy, malformed, or based on outdated API knowledge. **Mitigation**: Validation before persistence. Dry-run testing. Clear error messages that help the agent self-correct. The management UI shows tool status and lets users manually edit or remove broken tools.

### "Users don't trust agent-created tools"

Some users will be uncomfortable with their AI building its own tools. **Mitigation**: Off switch. Clear labeling. Audit trail. The pre-built integrations are always there as a safe baseline.

### "Credential setup breaks the flow"

The user has to leave the conversation to enter credentials in the UI. That context switch could kill the magic. **Mitigation**: Make the credential step as fast as possible. Pre-fill what the agent knows. Consider allowing credential entry via CLI for users who prefer it. In-chat credential entry for clients that support secure input fields in the future.

### "Create mode doesn't work with my client"

Not all MCP clients support dynamic tool list changes. **Mitigation**: Read mode is the default. Clear documentation on which clients support what. Push for broader client support.

### "Enterprise IT won't allow it"

Security teams may reject "AI creates its own tools" on principle. **Mitigation**: Granular controls. Disable tool creation, allow only tool use. Or allow creation only against pre-approved integrations. The separation of credentials from tools is the key selling point — lean into it.

### "It's confusing — is this Commandable or a new product?"

Brand fragmentation. **Mitigation**: Ship it as a feature of Commandable MCP, not a separate product. "Commandable MCP, now with Open Gloves." Or just "Commandable MCP with agent-created integrations" if the Open Gloves name doesn't stick.

### "Someone builds something dangerous"

An agent creates a tool that exfiltrates data to a malicious API. **Mitigation**: The sandbox constrains what tools can do. The proxy layer controls what URLs tools can reach. Domain allowlisting for enterprise deployments. All tool creation is auditable.

---

## Note: Per-Session Tool Loading (Create Mode)

Open Gloves depends on Create Mode. Over HTTP, that means the `/mcp/create` endpoint; over stdio, it remains the `create-mode` flow. Agent-created tools are persisted on the server but **not loaded into every chat by default**. Each new MCP session starts with only the meta-tools (`commandable_search_tools`, `commandable_enable_toolset`, `commandable_disable_toolset`, plus future creation tools). The agent discovers and enables the toolsets it needs for that specific conversation. This keeps the context window clean — a Stripe chat only loads Stripe tools, a Trello chat only loads Trello tools — while agent-created tools remain available to any future session that searches for them. The flow is: `commandable_search_tools` → nothing found → `create_tool` → tool exists forever → future sessions find it via `commandable_search_tools` → `commandable_enable_toolset` → use it. This requires client support for `notifications/tools/list_changed` (e.g. Claude Code).