# Docker Image Release Checklist (GHCR)

This document covers the one-time setup and release steps for publishing the Commandable MCP Docker image to GHCR.

## Canonical image

- `ghcr.io/commandable/commandable-mcp`

## One-time setup (GitHub)

1. Confirm repository is under the `commandable` org.
2. Confirm GitHub Actions is enabled for the repo.
3. Confirm GitHub Packages is enabled for the org/repo.
4. Confirm workflow permissions allow package publishing:
   - Workflow file sets `permissions.packages: write`.
   - Org policy allows `GITHUB_TOKEN` package write for this repo.
5. Confirm repository visibility/package visibility policy:
   - Set package visibility to public if you want anonymous pulls.

## First publish smoke

1. Trigger workflow manually:
   - GitHub -> Actions -> `Publish Docker image (GHCR)` -> `Run workflow`
2. Confirm package appears in GHCR:
   - `ghcr.io/commandable/commandable-mcp:main`
3. Pull and run locally:

```bash
docker pull ghcr.io/commandable/commandable-mcp:main
docker run --rm -p 3000:3000 \
  -e COMMANDABLE_ENCRYPTION_SECRET="replace-with-stable-secret" \
  -e COMMANDABLE_CONFIG_FILE=/app/commandable.config.yaml \
  -v "$PWD/commandable.config.yaml:/app/commandable.config.yaml:ro" \
  ghcr.io/commandable/commandable-mcp:main
```

4. Verify health endpoint:

```bash
curl http://localhost:3000/health
```

## Release publish steps

1. Create and push tag:

```bash
git tag vX.Y.Z
git push origin vX.Y.Z
```

2. Confirm published tags:
   - `ghcr.io/commandable/commandable-mcp:vX.Y.Z`
   - `ghcr.io/commandable/commandable-mcp:latest`
   - `ghcr.io/commandable/commandable-mcp:main` (from default-branch pushes)

## Troubleshooting

- If push fails with package permission errors, check org Actions policy for `GITHUB_TOKEN` package write permissions.
- If image is private unexpectedly, update package visibility in GitHub Packages settings.
