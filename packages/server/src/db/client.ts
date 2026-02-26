import { resolve } from 'node:path'
import { homedir } from 'node:os'
import Database from 'better-sqlite3'
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3'
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

export type DbDialect = 'sqlite' | 'postgres'

export type DbClient =
  | { dialect: 'sqlite', db: ReturnType<typeof drizzleSqlite>, raw: any, close: () => void }
  | { dialect: 'postgres', db: ReturnType<typeof drizzlePg>, raw: Pool, close: () => Promise<void> }

export interface CreateDbOptions {
  sqlitePath?: string
  databaseUrl?: string
}

export function createDbFromEnv(): DbClient {
  const dataDir = process.env.COMMANDABLE_DATA_DIR
  const sqliteFromDataDir = dataDir && dataDir.trim().length
    ? resolve(dataDir, 'credentials.sqlite')
    : undefined
  return createDb({
    databaseUrl: process.env.DATABASE_URL,
    sqlitePath: process.env.COMMANDABLE_MCP_SQLITE_PATH || sqliteFromDataDir,
  })
}

export function createDb(opts: CreateDbOptions = {}): DbClient {
  const databaseUrl = opts.databaseUrl || process.env.DATABASE_URL
  if (databaseUrl) {
    const pool = new Pool({ connectionString: databaseUrl })
    const db = drizzlePg(pool)
    return {
      dialect: 'postgres',
      db,
      raw: pool,
      close: async () => {
        await pool.end()
      },
    }
  }

  const sqlitePath = opts.sqlitePath
    ? resolve(opts.sqlitePath)
    : resolve(homedir(), '.commandable', 'credentials.sqlite')

  const sqlite = new Database(sqlitePath)
  const db = drizzleSqlite(sqlite)
  return {
    dialect: 'sqlite',
    db,
    raw: sqlite,
    close: () => sqlite.close(),
  }
}

