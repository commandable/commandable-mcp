import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const serverPkgRoot = resolve(here, '..')
const repoRoot = resolve(serverPkgRoot, '..', '..')

const appOutput = resolve(repoRoot, 'app', '.output')
const dest = resolve(serverPkgRoot, 'dist', 'app')

if (!existsSync(appOutput)) {
  console.error(`[bundle-ui] Missing Nuxt build output at: ${appOutput}`)
  console.error('[bundle-ui] Run: yarn workspace commandable-mcp-app build')
  process.exit(1)
}

try {
  rmSync(dest, { recursive: true, force: true })
} catch {}

cpSync(appOutput, dest, { recursive: true })
console.error(`[bundle-ui] Copied ${appOutput} -> ${dest}`)

// Copy SQLite migrations into the bundled server so ensureSchema() can find them
// at runtime (Nuxt bundles the JS but not the migration SQL/json files).
const migrationSrc = resolve(serverPkgRoot, 'src', 'db', 'migrations')
// index.mjs sets _importMeta_.url = import.meta.url (i.e. server/index.mjs),
// so ensureSchema resolves migrations relative to server/
const migrationDest = resolve(dest, 'server', 'migrations')
if (existsSync(migrationSrc)) {
  mkdirSync(migrationDest, { recursive: true })
  cpSync(migrationSrc, migrationDest, { recursive: true })
  console.error(`[bundle-ui] Copied migrations -> ${migrationDest}`)
}
else {
  console.error(`[bundle-ui] Warning: migrations source not found at: ${migrationSrc}`)
}

