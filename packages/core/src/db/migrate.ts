import { existsSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { migrate as migrateSqlite } from 'drizzle-orm/better-sqlite3/migrator'
import { migrate as migratePg } from 'drizzle-orm/node-postgres/migrator'
import type { DbClient } from './client.js'

function resolveMigrationsFolder(dialect: 'sqlite' | 'pg'): string {
  const cwd = process.cwd()
  const candidates = [
    new URL(`./${dialect}`, new URL('./migrations/', import.meta.url)).pathname,
    resolve(cwd, 'packages/core/src/db/migrations', dialect),
    resolve(cwd, 'packages/core/dist/db/migrations', dialect),
    resolve(cwd, 'node_modules/@commandable/mcp-core/dist/db/migrations', dialect),
    resolve(cwd, 'app/.output/server/node_modules/@commandable/mcp-core/dist/db/migrations', dialect),
  ]

  return candidates.find(path => existsSync(join(path, 'meta', '_journal.json')))
    || candidates[0]!
}

export async function ensureSchema(client: DbClient): Promise<void> {
  const dialect = client.dialect === 'sqlite' ? 'sqlite' : 'pg'
  const migrationsFolder = resolveMigrationsFolder(dialect)
  if (client.dialect === 'sqlite')
    migrateSqlite(client.db, { migrationsFolder })
  else
    await migratePg(client.db, { migrationsFolder })
}
