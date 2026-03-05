import { migrate as migrateSqlite } from 'drizzle-orm/better-sqlite3/migrator'
import { migrate as migratePg } from 'drizzle-orm/node-postgres/migrator'
import type { DbClient } from './client.js'

export async function ensureSchema(client: DbClient): Promise<void> {
  const dialect = client.dialect === 'sqlite' ? 'sqlite' : 'pg'
  const migrationsFolder = new URL(`./${dialect}`, new URL('./migrations/', import.meta.url)).pathname
  if (client.dialect === 'sqlite')
    migrateSqlite(client.db, { migrationsFolder })
  else
    await migratePg(client.db, { migrationsFolder })
}
