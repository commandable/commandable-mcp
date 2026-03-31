import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const serverPkgRoot = resolve(here, '..')

const src = resolve(serverPkgRoot, 'src', 'file-extractor')
const dest = resolve(serverPkgRoot, 'dist', 'file-extractor')

if (!existsSync(src)) {
  console.error(`[copy-file-extractor] Missing file extractor folder: ${src}`)
  process.exit(1)
}

mkdirSync(dirname(dest), { recursive: true })
cpSync(src, dest, { recursive: true })
console.error(`[copy-file-extractor] Copied ${src} -> ${dest}`)
