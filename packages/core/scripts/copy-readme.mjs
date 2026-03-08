import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const serverPkgRoot = resolve(here, '..')

const assets = [
  {
    src: resolve(serverPkgRoot, 'src', 'mcp', 'commandable_readme.md'),
    dest: resolve(serverPkgRoot, 'dist', 'mcp', 'commandable_readme.md'),
  },
  {
    src: resolve(serverPkgRoot, 'src', 'mcp', 'builder_guide.md'),
    dest: resolve(serverPkgRoot, 'dist', 'mcp', 'builder_guide.md'),
  },
]

for (const a of assets) {
  if (!existsSync(a.src)) {
    console.error(`[copy-readme] Missing source file: ${a.src}`)
    process.exit(1)
  }

  mkdirSync(dirname(a.dest), { recursive: true })
  cpSync(a.src, a.dest)
  console.error(`[copy-readme] Copied ${a.src} -> ${a.dest}`)
}

