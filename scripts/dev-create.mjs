import { spawnSync } from 'node:child_process'
import pc from 'picocolors'

const result = spawnSync(
  process.execPath,
  ['packages/server/dist/cli/bin.js', 'create', '--source', 'local'],
  {
    cwd: process.cwd(),
    env: process.env,
    encoding: 'utf8',
    stdio: 'pipe',
  },
)

if (result.error) {
  console.error(result.error.message)
  process.exit(1)
}

const rawOutput = `${result.stderr || result.stdout || ''}`
const addCommand = rawOutput
  .split('\n')
  .map(l => l.trim())
  .find(l => l.startsWith('claude mcp add')) ?? ''

if (result.status !== 0 || !addCommand) {
  if (result.stdout)
    process.stdout.write(result.stdout)
  if (result.stderr)
    process.stderr.write(result.stderr)
  process.exit(result.status ?? 1)
}

const line = '─'.repeat(60)
console.error('')
console.error(pc.bold('Connect Claude Code to the local dev instance'))
console.error(pc.dim(line))
console.error(pc.cyan('claude mcp remove commandable'))
console.error(pc.cyan(addCommand))
console.error(pc.dim(line))
console.error(pc.dim('Paste the commands above into your terminal, then restart Claude Code.'))
console.error(pc.dim('Previous Commandable instances keep their own state and can be re-added later.'))
console.error('')
