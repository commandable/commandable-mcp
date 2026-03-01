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

The integration suites are **credentials-first** and will skip automatically unless the required env vars are set.

1. Copy the template:
```bash
cp .env.test.example .env.test
```

2. Fill in credentials (and any required IDs for a given integration).
3. Run:
```bash
yarn test
```

Notes:
- Many suites perform **write operations** (create/update/delete/archive). Use a dedicated test account/workspace if possible.
- Trello tests create a board per run and attempt to close + delete it in `afterAll`.
- Google Docs/Sheets/Slides tests create a Drive folder + files per run and delete them in `afterAll` (files are created via Drive, inside the folder).
- Notion write tests create a database under `NOTION_TEST_PARENT_PAGE_ID` and archive it in `afterAll`.
- Google integrations support either `GOOGLE_SERVICE_ACCOUNT_JSON` or `GOOGLE_TOKEN` (and optionally `GOOGLE_IMPERSONATE_SUBJECT` for Calendar with domain-wide delegation).

Optional env vars used by some suites:
- `GDOCS_TEST_IMAGE_URI` (Docs inline image test)
- `GSLIDES_TEST_IMAGE_URI` (Slides image test)

## Hosted-only managed OAuth smoke (optional)

There is also a small hosted-only smoke suite that exercises the managed OAuth proxy path.
It is skipped unless `COMMANDABLE_MANAGED_OAUTH_BASE_URL` and `COMMANDABLE_MANAGED_OAUTH_SECRET_KEY` are set.

1. Copy the template:
```bash
cp .env.test.managed.example .env.test.managed
```

2. Fill in connection IDs (and optional resource IDs for Google smoke).
3. Run:
```bash
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

