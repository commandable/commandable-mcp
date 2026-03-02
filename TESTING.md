# Testing

## Running tests

From the repo root:

```bash
yarn test
```

This runs Vitest in the `@commandable/mcp` workspace and includes:
- Core unit tests in `packages/server/src/__tests__/`
- Live integration handler suites in `packages/integration-data/integrations/*/__tests__/`

## Live integration tests (credentials-first)

The integration suites are **credentials-first** and will skip automatically unless the required
env vars are set.

Each integration now has its own `.env.test` file in its folder. To set up credentials for a
specific integration, copy its example file and fill it in:

```bash
# Example: set up Jira credentials
cp packages/integration-data/integrations/jira/.env.test.example \
   packages/integration-data/integrations/jira/.env.test
```

Google integrations (Calendar, Docs, Drive, Gmail, Sheets, Slides) share credentials via a
root-level file. Each integration may additionally have its own file for integration-specific
extras:

```bash
# Shared Google credentials (required for any google-* integration)
cp .env.test.google.example .env.test.google

# Optional: Google Calendar extras
cp packages/integration-data/integrations/google-calendar/.env.test.example \
   packages/integration-data/integrations/google-calendar/.env.test

# Optional: Gmail extras
cp packages/integration-data/integrations/google-gmail/.env.test.example \
   packages/integration-data/integrations/google-gmail/.env.test
```

Then run:

```bash
yarn test
```

Notes:
- Many suites perform **write operations** (create/update/delete/archive). Use a dedicated test account/workspace if possible.
- Trello tests create a board per run and attempt to close + delete it in `afterAll`.
- Google Docs/Sheets/Slides tests create a Drive folder + files per run and delete them in `afterAll`.
- Notion write tests create a database under `NOTION_TEST_PARENT_PAGE_ID` and archive it in `afterAll`.
- Google integrations support either `GOOGLE_SERVICE_ACCOUNT_JSON` or `GOOGLE_TOKEN` (and optionally `GOOGLE_IMPERSONATE_SUBJECT` for Calendar with domain-wide delegation).

## Hosted-only managed OAuth smoke (optional)

There is also a small hosted-only smoke suite that exercises the managed OAuth proxy path.
It is skipped unless `COMMANDABLE_MANAGED_OAUTH_BASE_URL` and `COMMANDABLE_MANAGED_OAUTH_SECRET_KEY` are set.

```bash
cp .env.test.managed.example .env.test.managed
# Fill in connection IDs and optional resource IDs, then:
yarn test
```

## Container smoke check (GHCR image)

To verify a published image quickly:

```bash
docker pull ghcr.io/commandable/commandable-mcp:main
docker run --rm -p 3000:3000 \
  -e COMMANDABLE_ENCRYPTION_SECRET="replace-with-stable-secret" \
  -e COMMANDABLE_CONFIG_FILE=/app/commandable.config.yaml \
  -v "$PWD/commandable.config.yaml:/app/commandable.config.yaml:ro" \
  ghcr.io/commandable/commandable-mcp:main
```

Then verify the server is up:

```bash
curl http://localhost:3000/health
```

---

## CI: per-integration matrix

CI runs each integration as an independent job. Core unit tests run first; then all 12
integration jobs run in parallel with `fail-fast: false`, so one integration failure doesn't
cancel the others. See `.github/workflows/commandable-mcp-ci.yml`.

## Live test badges (maintainer setup)

Badges in the README show live test results for each integration, updated on every push to
`main`. They are backed by a GitHub Gist via
[shields.io/endpoint](https://shields.io/endpoint). One-time setup:

1. **Create a Gist** at [gist.github.com](https://gist.github.com) (can be secret).
   Note the Gist ID from the URL (the long alphanumeric part).

2. **Create a Personal Access Token** with `gist` scope at
   [github.com/settings/tokens](https://github.com/settings/tokens).

3. **Add repo secret**:
   - Secret `GIST_SECRET`: the PAT from step 2

4. **Update `scripts/badge-config.json`** with your Gist owner username and Gist ID,
   then re-run the doc generator:

   ```bash
   # Edit scripts/badge-config.json:
   # { "gistOwner": "your-github-username", "gistId": "abc123..." }
   node scripts/generate-integration-docs.mjs
   ```

   This regenerates all per-integration READMEs and the root README table with live badge URLs.

5. **Commit and push** — the next CI run on `main` will populate the Gist files and the badges
   will become live.

## Regenerating integration docs

Integration READMEs (`packages/integration-data/integrations/*/README.md`) and the root
README table are generated from manifest data. To regenerate after changing a manifest:

```bash
node scripts/generate-integration-docs.mjs
```
