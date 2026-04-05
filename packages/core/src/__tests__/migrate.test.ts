import { fileURLToPath } from 'node:url'
import { chdir, cwd } from 'node:process'
import { mkdirSync, rmSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { createDb } from '../db/client.js'
import { ensureSchema } from '../db/migrate.js'

function makeTempSqlitePath(): string {
  const rand = Math.random().toString(16).slice(2)
  return fileURLToPath(new URL(`./tmp-migrate-${Date.now()}-${rand}.sqlite`, import.meta.url))
}

function makeTempDir(): string {
  const rand = Math.random().toString(16).slice(2)
  const path = fileURLToPath(new URL(`./tmp-cwd-${Date.now()}-${rand}/`, import.meta.url))
  mkdirSync(path, { recursive: true })
  return path
}

describe('ensureSchema', () => {
  it('applies embedded migrations without depending on cwd', async () => {
    const sqlitePath = makeTempSqlitePath()
    const tempCwd = makeTempDir()
    const originalCwd = cwd()
    const db = createDb({ sqlitePath })

    try {
      chdir(tempCwd)
      await ensureSchema(db)

      const columns = db.raw.prepare('PRAGMA table_info(integrations)').all() as Array<{ name: string }>
      expect(columns.some(column => column.name === 'config')).toBe(true)
    }
    finally {
      chdir(originalCwd)
      db.close()
      rmSync(sqlitePath, { force: true })
      rmSync(tempCwd, { recursive: true, force: true })
    }
  })
})
