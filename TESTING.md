# Testing

## Running tests

From the repo root:

```bash
yarn test
```

This runs Vitest in the `@commandable/mcp` workspace and includes:\n+
- Core unit tests in `packages/server/src/__tests__/`\n+
- Live integration handler suites in `packages/integration-data/integrations/*/__tests__/`\n+

## Live integration tests (credentials-first)

The integration suites are **credentials-first** and will skip automatically unless the required env vars are set.

1. Copy the template:\n+
```bash
cp .env.test.example .env.test
```

2. Fill in credentials + IDs.\n+
3. Run:\n+
```bash
yarn test
```

Notes:\n+
- Some suites perform **write operations** (create/update/delete). Only enable the variables for integrations you’re comfortable writing to.\n+
- Google integrations support either `GOOGLE_SERVICE_ACCOUNT_JSON` or `GOOGLE_TOKEN`.\n+

## Hosted-only managed OAuth smoke (optional)

There is also a small hosted-only smoke suite that exercises the managed OAuth proxy path.\n+
It is skipped unless `COMMANDABLE_MANAGED_OAUTH_BASE_URL` and `COMMANDABLE_MANAGED_OAUTH_SECRET_KEY` are set.\n+

1. Copy the template:\n+
```bash
cp .env.test.managed.example .env.test.managed
```

2. Fill in connection IDs.\n+
3. Run:\n+
```bash
yarn test
```

