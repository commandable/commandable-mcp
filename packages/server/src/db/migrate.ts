import type { DbClient } from './client.js'

export async function ensureSchema(client: DbClient): Promise<void> {
  if (client.dialect === 'sqlite') {
    client.raw.exec(`
      CREATE TABLE IF NOT EXISTS integrations (
        id TEXT PRIMARY KEY NOT NULL,
        space_id TEXT,
        type TEXT NOT NULL,
        reference_id TEXT NOT NULL,
        label TEXT NOT NULL,
        connection_method TEXT,
        connection_id TEXT,
        credential_id TEXT,
        credential_variant TEXT,
        config_json TEXT,
        enabled_toolsets TEXT,
        max_scope TEXT,
        disabled_tools TEXT,
        created_at INTEGER NOT NULL
      );
    `)

    // Migrate existing databases that predate the max_scope / disabled_tools columns.
    // SQLite does not support IF NOT EXISTS on ALTER TABLE ADD COLUMN, so we check the
    // column list first and only add if missing.
    const integrationCols: Array<{ name: string }> = client.raw.prepare('PRAGMA table_info(integrations)').all() as any
    const colNames = new Set(integrationCols.map((c: { name: string }) => c.name))
    if (!colNames.has('max_scope'))
      client.raw.exec('ALTER TABLE integrations ADD COLUMN max_scope TEXT;')
    if (!colNames.has('disabled_tools'))
      client.raw.exec('ALTER TABLE integrations ADD COLUMN disabled_tools TEXT;')
    if (!colNames.has('enabled'))
      client.raw.exec('ALTER TABLE integrations ADD COLUMN enabled INTEGER NOT NULL DEFAULT 1;')

    client.raw.exec(`
      CREATE TABLE IF NOT EXISTS credentials (
        space_id TEXT NOT NULL,
        id TEXT NOT NULL,
        ciphertext TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        PRIMARY KEY (space_id, id)
      );
    `)

    client.raw.exec(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        key_hash TEXT NOT NULL,
        scopes_json TEXT,
        created_at INTEGER NOT NULL
      );
    `)

    client.raw.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY NOT NULL,
        email TEXT NOT NULL,
        password_hash TEXT,
        created_at INTEGER NOT NULL
      );
    `)

    return
  }

  await client.raw.query(`
    CREATE TABLE IF NOT EXISTS integrations (
      id TEXT PRIMARY KEY,
      space_id TEXT,
      type TEXT NOT NULL,
      reference_id TEXT NOT NULL,
      label TEXT NOT NULL,
      connection_method TEXT,
      connection_id TEXT,
      credential_id TEXT,
      credential_variant TEXT,
      config_json JSONB,
      enabled_toolsets TEXT,
      max_scope TEXT,
      disabled_tools TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  // Migrate existing Postgres databases that predate the max_scope / disabled_tools columns.
  await client.raw.query(`
    ALTER TABLE integrations ADD COLUMN IF NOT EXISTS max_scope TEXT;
  `)
  await client.raw.query(`
    ALTER TABLE integrations ADD COLUMN IF NOT EXISTS disabled_tools TEXT;
  `)
  await client.raw.query(`
    ALTER TABLE integrations ADD COLUMN IF NOT EXISTS enabled TEXT NOT NULL DEFAULT '1';
  `)

  await client.raw.query(`
    CREATE TABLE IF NOT EXISTS credentials (
      space_id TEXT NOT NULL,
      id TEXT NOT NULL,
      ciphertext TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (space_id, id)
    );
  `)

  await client.raw.query(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      key_hash TEXT NOT NULL,
      scopes_json JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  await client.raw.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      password_hash TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)
}

