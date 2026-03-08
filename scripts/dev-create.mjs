import { spawnSync } from 'node:child_process'

const result = spawnSync(
  process.execPath,
  ['app/bin/commandable-mcp.mjs', 'create'],
  {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
  },
)

process.exit(result.status ?? 0)
