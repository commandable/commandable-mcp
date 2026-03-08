import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const serverPkgRoot = resolve(here, '..')

const src = resolve(serverPkgRoot, 'src', 'db', 'migrations')
const dest = resolve(serverPkgRoot, 'dist', 'db', 'migrations')

if (!existsSync(src)) {
  console.error(`[copy-migrations] Missing migrations folder: ${src}`)
  process.exit(1)
}

mkdirSync(dirname(dest), { recursive: true })
cpSync(src, dest, { recursive: true })
console.error(`[copy-migrations] Copied ${src} -> ${dest}`)
