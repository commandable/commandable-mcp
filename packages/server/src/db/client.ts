import { dirname, resolve } from 'node:path'
import { mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import Database from 'better-sqlite3'
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3'
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

export type DbDialect = 'sqlite' | 'postgres'

export type AnyDrizzle = ReturnType<typeof drizzleSqlite> | ReturnType<typeof drizzlePg>

export type DbClient =
  | { dialect: 'sqlite', db: ReturnType<typeof drizzleSqlite>, raw: InstanceType<typeof Database>, close: () => void }
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

  // Ensure parent directory exists so SQLite can create the file.
  // (better-sqlite3 does not create directories automatically)
  try {
    mkdirSync(dirname(sqlitePath), { recursive: true, mode: 0o700 })
  }
  catch {}

  const sqlite = new Database(sqlitePath)
  const db = drizzleSqlite(sqlite)
  return {
    dialect: 'sqlite',
    db,
    raw: sqlite,
    close: () => sqlite.close(),
  }
}

