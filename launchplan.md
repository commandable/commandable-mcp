# Commandable MCP — Launch Plan

> MCP-only launch. The main Commandable agent platform stays behind a "coming soon / join the waiting list" page. MCP (open source + hosted) is the first product people see.
>
> **Payments live on the main app.** One Paddle webhook, one account tier, one source of truth. The MCP hosted app reads the shared accounts table to check tier and enforce limits. When the main app launches later, payments already work everywhere.

---

## Phase 1: Polish & Publish the Open-Source MCP Server
**Goal**: The OSS project is live on GitHub and npm. First thing the world sees.
**Estimated effort**: 2–3 days

### Branding cleanup
- [ ] Replace the NuxtUI template logo (`AppLogo.vue`) with a Commandable logo
- [ ] Update SEO meta in `app.vue` — currently says "Nuxt Starter Template"
- [ ] Remove the NuxtUI template footer/links and `TemplateMenu.vue`

### Code cleanup
- [ ] Remove Slack and Jira from `providerRegistry.ts` (no integration-data yet — confusing for contributors)
- [ ] Fix the duplicated workflow definition in `commandable-mcp-ci.yml`
- [ ] Verify the `npx` first-run experience on a clean machine (fresh npm cache, no prior config)
- [ ] Confirm the CLI produces a valid Claude Desktop / Cursor config snippet

### Publishing
- [ ] Check that `@commandable/mcp` (or `commandable-mcp`) is available on npm
- [ ] Version `0.1.0` (signals early but intentional)
- [ ] Create GitHub repo under the Commandable org
- [ ] `git subtree split` to extract `commandable-mcp/` with clean history, push to the new repo
- [ ] `npm publish --access public`
- [ ] Verify `npx` install works end-to-end from npm

### Documentation
- [ ] README quick-start instructions that actually work from npm (not just local dev)
- [ ] `CONTRIBUTING.md` — how to add integrations, run tests, submit PRs
- [ ] Brief architecture section in README or a separate `ARCHITECTURE.md`

### Done when
A developer can `npx @commandable/mcp`, connect GitHub + Notion in under 5 minutes, paste the config into Claude Desktop, and ask "list my repos" — and it works. The GitHub repo looks professional.

---

## Phase 2: Fix Payments on the Main App
**Goal**: Paddle payments work end-to-end. This is the single payment system for everything — MCP hosted, and later the agent platform.
**Estimated effort**: 2–3 days (can run in parallel with Phase 1)

### What's broken
- Paddle checkout opens and collects payment, but **there is no webhook endpoint** — the account tier never actually updates in the database.
- Two different price IDs hardcoded in different places (`account.vue` vs `AppPaymentRequiredModal.vue`). One may be stale.
- Usage enforcement is **client-side only** (`hasPaymentOptionAvailable()` in the Pinia store). No server-side guard.

### Tasks
- [ ] Create `server/api/webhooks/paddle.post.ts` on the main app — verify Paddle signature, handle `subscription.created` (tier → pro), `subscription.cancelled` (tier → free), `subscription.updated`
- [ ] Register the webhook URL in Paddle dashboard (sandbox + production)
- [ ] Reconcile the two price IDs — confirm which is sandbox vs production, remove the stale one
- [ ] Add server-side tier/usage enforcement on the main app's API routes (not just client-side)
- [ ] Add a "Manage Subscription" link on the account page (Paddle customer portal URL)
- [ ] Test the full flow: free → checkout → webhook fires → tier updates to pro → cancel → tier reverts

### Done when
A user can upgrade to Pro via Paddle, the `accounts` table reflects the tier change within seconds, and cancellation reverts it. This works regardless of whether the user came from the MCP app or the main app.

---

## Phase 3: Ship the Hosted Version (mcp.commandable.ai)
**Goal**: Users can sign up, connect integrations via OAuth, and get a hosted MCP endpoint.
**Estimated effort**: 1.5–2 weeks

### Architecture decisions

**Auth**: Same Firebase project as the main app. Shared user identity. The MCP app runs its own Firebase Admin middleware to verify tokens.

**Accounts**: Shared accounts table in the shared Postgres instance. When a user signs up on the MCP app, a Commandable account is created (same `createUser` flow as the main app — Firebase UID, personal account, free tier). One account, visible from both apps.

**Payments**: The MCP app does NOT handle payments itself. It reads the account tier from the shared database. To upgrade, the MCP UI either:
- Embeds the same Paddle checkout (same price ID, `customData` includes account_id, webhook hits the main app), or
- Links to `commandable.ai/account` for subscription management

Either way, the main app's webhook (Phase 2) is the single handler that updates the tier.

**Rate limiting**: MCP app reads the tier, enforces tool-call limits locally. Free: ~100 calls/day. Pro: ~5000 calls/day.

**OAuth**: Nango (already deployed for the main app). Reuse the same instance.

### Tasks

#### Multi-tenancy
- [ ] Add `account_id` to MCP integrations and credentials tables
- [ ] Scope all database queries by account
- [ ] Scope the `/mcp` endpoint so each API key resolves to an account

#### Auth & account creation
- [ ] Add Firebase Auth to the MCP Nuxt app (same Firebase project)
- [ ] Server middleware: verify Firebase ID tokens, attach user context
- [ ] On first login, call the shared account creation logic (or call the main app's `/api/user` endpoint) to create a Commandable account
- [ ] Protect all `/api/*` routes behind authentication

#### API key provisioning
- [ ] Page where users generate, view, and revoke MCP API keys
- [ ] Each key hashed and linked to an account
- [ ] Extend `mcpAuth.ts` to resolve API key → account

#### Managed OAuth (via Nango)
- [ ] "Connect with OAuth" buttons for GitHub, Google, Notion, Trello
- [ ] Store Nango connection ID with the integration, inject OAuth token at request time
- [ ] Keep "paste API key" as a fallback

#### Upgrade flow
- [ ] Embed Paddle checkout in the MCP UI (same price ID as the main app, webhook hits the main app's endpoint)
- [ ] Show current tier and usage in the MCP dashboard
- [ ] "Manage Subscription" link → Paddle customer portal
- [ ] When tier is free and limit is hit, show a clear upgrade prompt

#### Rate limiting & usage tracking
- [ ] Per-account rate limiting on `/mcp` — read tier from shared accounts table
- [ ] Clear MCP error responses when rate-limited
- [ ] Usage tracking (tool calls per account per day)
- [ ] All enforcement is server-side

#### Deployment
- [ ] Deploy to Azure Container Apps (or similar) at `mcp.commandable.ai`
- [ ] Connect to the shared Postgres instance
- [ ] Connect to the existing Nango instance
- [ ] TLS, domain, health checks
- [ ] Basic monitoring / alerting

### Done when
A new user can go to `mcp.commandable.ai`, sign up (which creates a Commandable account), connect GitHub via OAuth, copy their endpoint + API key, paste it into Claude Desktop, and use it. Free users hit a rate limit. Upgrading to Pro works via the shared payment flow.

---

## Phase 4: commandable.ai → Landing Page
**Goal**: The main domain becomes a teaser for the agent platform with a clear funnel to MCP.
**Estimated effort**: 1–2 days (can run in parallel with Phase 3)

### Tasks
- [ ] Replace the main app's public-facing pages with a clean landing page:
  - What Commandable is (AI agent platform — coming soon)
  - "Join the waiting list" email capture
  - Prominent link/section: "Try Commandable MCP — connect your apps to any AI assistant" → links to GitHub repo and `mcp.commandable.ai`
- [ ] Keep the main app's backend running (auth, Paddle webhook, account management all need to stay up since the MCP app depends on them)
- [ ] Gate new signups to the agent platform — waiting list only
- [ ] Set up the waiting list (email → Airtable/Notion/database, or a service like Loops/Buttondown)

### Done when
`commandable.ai` has a polished landing page. Visitors understand what's coming, can join the waiting list, and get funnelled toward MCP.

---

## Phase 5: Slack & Jira Integrations
**Goal**: Cover the two most-requested missing integrations before launch noise dies down.
**Estimated effort**: 3–5 days (already in the provider registry, architecture is proven)

### Tasks
- [ ] **Slack**: manifest, credentials, handlers, schemas, tests — list channels, read messages, post message, search, list users
- [ ] **Jira**: manifest, credentials, handlers, schemas, tests — list projects, search issues (JQL), get/create/update issue, add comment, transition
- [ ] Push to the public OSS repo
- [ ] Add OAuth support for both in the hosted version (Nango has connectors for both)

### Done when
Both pass usage parity + live API tests in CI. OSS users can use API keys; hosted users can connect via OAuth. Integration count is now 10.

---

## Phase 6: Launch
**Goal**: Coordinated public launch of OSS + hosted together.
**Estimated effort**: 2–3 days prep + soft launch buffer

### Pre-launch checklist

#### OSS
- [ ] GitHub repo public, README polished
- [ ] npm package works via `npx`
- [ ] First-run tested on macOS, Linux, Windows (WSL)
- [ ] 8 current integrations tested fully

#### Hosted
- [ ] `mcp.commandable.ai` live and stable for at least a few days
- [ ] OAuth works for GitHub, Google suite, Notion, Slack
- [ ] Payments working end-to-end (free → Pro → cancel) via shared main app webhook
- [ ] Rate limits enforced, usage tracking working

#### commandable.ai
- [ ] Landing page live with waiting list
- [ ] Main app backend healthy (webhook, auth, account management serving the MCP app)

#### Content
- [ ] Blog post: "Introducing Commandable MCP — one server for all your AI tools"
- [ ] Short demo video (2 min): install → connect GitHub → ask Claude to create an issue → it works
- [ ] README has a GIF or screenshot of the "it actually works" moment
- [ ] Prepared posts for: Hacker News, Reddit (r/LocalLLaMA, r/ChatGPT, r/cursor), MCP Discord, Twitter/X

#### Soft launch (3–5 days before the big push)
- [ ] Share in 2–3 smaller communities (MCP Discord, dev Slacks)
- [ ] Monitor for first-run bugs, confusing docs, missing error handling
- [ ] Fix what comes up
- [ ] Collect 1–2 early testimonials or screenshots

### Launch day
- [ ] Publish blog post
- [ ] "Show HN: Commandable MCP — One MCP server for all your apps (open source)"
- [ ] Reddit, Twitter, Discord
- [ ] Monitor GitHub issues, npm installs, `mcp.commandable.ai` health
- [ ] Available to respond to comments/issues for 48 hours

### Done when
OSS repo has traction (stars, forks, real issues). Hosted version has signups. At least one user has gone free → Pro.

---

## Phase 7: Post-Launch Fast Follows
**Goal**: Respond to feedback and build momentum. Not launch-blocking.

### Likely priorities (reorder based on what users actually ask for)
- [ ] **Linear integration** — the Cursor/AI dev audience will want this immediately
- [ ] **Gmail / Google Drive** — rounds out the Google suite
- [ ] **Create mode / lazy tool loading** — important when tool count exceeds ~50
- [ ] **VM sandbox security review** — `node:vm` is leaky; focused review before enterprise adoption
- [ ] **Opt-in anonymous telemetry** — which integrations are popular, error rates
- [ ] **Document processing sidecar** (from agentcontext.md) — major differentiator, not urgent
- [ ] **App-level tests for the MCP Nuxt app** — currently zero

---

## Timeline Summary

| Phase | What | Effort | Cumulative |
|-------|------|--------|------------|
| 1 | Polish & publish OSS | 2–3 days | ~3 days |
| 2 | Fix payments (main app) | 2–3 days (parallel with 1) | ~3 days |
| 3 | Ship hosted MCP version | 1.5–2 weeks | ~2.5 weeks |
| 4 | commandable.ai landing page | 1–2 days (parallel with 3) | — |
| 5 | Slack + Jira | 3–5 days | ~3.5 weeks |
| 6 | Launch prep + soft launch + launch | ~1 week | ~4.5 weeks |
| 7 | Post-launch | Ongoing | — |

**Aggressive**: ~4 weeks to launch day.
**Realistic**: ~5–6 weeks.

### Key dependency chain
```
Phase 1 (OSS) ─────────────────────────→ Phase 6 (Launch)
                                              ↑
Phase 2 (Payments) → Phase 3 (Hosted) ──────┘
                       ↕ parallel
                     Phase 4 (Landing)
                                              ↑
                     Phase 5 (Slack/Jira) ────┘
```

Phase 1 and 2 start in parallel immediately. Phase 3 starts once Phase 2 is done (needs the webhook working). Phase 4 runs alongside Phase 3. Phase 5 can overlap with late Phase 3.
