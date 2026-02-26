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
        config_json TEXT,
        created_at INTEGER NOT NULL
      );
    `)

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
      config_json JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
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

