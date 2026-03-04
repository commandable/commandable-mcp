import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const serverPkgRoot = resolve(here, '..')

const src = resolve(serverPkgRoot, 'src', 'mcp', 'commandable_readme.md')
const dest = resolve(serverPkgRoot, 'dist', 'mcp', 'commandable_readme.md')

if (!existsSync(src)) {
  console.error(`[copy-readme] Missing source file: ${src}`)
  process.exit(1)
}

mkdirSync(dirname(dest), { recursive: true })
cpSync(src, dest)
console.error(`[copy-readme] Copied ${src} -> ${dest}`)

