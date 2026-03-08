import { spawnSync } from 'node:child_process'

const result = spawnSync(
  process.execPath,
  ['packages/server/dist/cli/bin.js', 'create', '--source', 'local'],
  {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
  },
)

process.exit(result.status ?? 0)
