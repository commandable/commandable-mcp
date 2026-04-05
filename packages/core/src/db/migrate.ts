import type { MigrationConfig } from 'drizzle-orm/migrator'
import type { AnyDrizzle, DbClient } from './client.js'
import { pgMigrations, sqliteMigrations } from './generated-migrations.js'

const migrationConfig: MigrationConfig = { migrationsFolder: '' }

type MigratableDb = AnyDrizzle & {
  dialect: { migrate: (migrations: unknown, session: unknown, config: string | MigrationConfig) => Promise<void> | void }
  session: unknown
}

function asMigratableDb(db: AnyDrizzle): MigratableDb {
  return db as MigratableDb
}

export async function ensureSchema(client: DbClient): Promise<void> {
  const db = asMigratableDb(client.db)
  if (client.dialect === 'sqlite')
    db.dialect.migrate(sqliteMigrations, db.session, migrationConfig)
  else
    await db.dialect.migrate(pgMigrations, db.session, migrationConfig)
}
