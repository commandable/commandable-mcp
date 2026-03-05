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
    if (!colNames.has('health_status'))
      client.raw.exec('ALTER TABLE integrations ADD COLUMN health_status TEXT;')
    if (!colNames.has('health_checked_at'))
      client.raw.exec('ALTER TABLE integrations ADD COLUMN health_checked_at INTEGER;')

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

    client.raw.exec(`
      CREATE TABLE IF NOT EXISTS custom_tools (
        id TEXT PRIMARY KEY NOT NULL,
        space_id TEXT NOT NULL,
        integration_id TEXT NOT NULL,
        name TEXT NOT NULL,
        label TEXT,
        description TEXT,
        input_schema TEXT NOT NULL,
        handler_code TEXT NOT NULL,
        scope TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `)
    client.raw.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS custom_tools__space_integration_name
      ON custom_tools(space_id, integration_id, name);
    `)

    client.raw.exec(`
      CREATE TABLE IF NOT EXISTS custom_integration_configs (
        id TEXT PRIMARY KEY NOT NULL,
        space_id TEXT NOT NULL,
        type_slug TEXT NOT NULL,
        label TEXT NOT NULL,
        base_url TEXT NOT NULL,
        auth_type TEXT NOT NULL,
        credential_schema TEXT NOT NULL,
        credential_injection TEXT,
        basic_username_field TEXT,
        basic_password_field TEXT,
        health_check_path TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `)
    client.raw.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS custom_integration_configs__space_type_slug
      ON custom_integration_configs(space_id, type_slug);
    `)

    client.raw.exec(`
      CREATE TABLE IF NOT EXISTS integration_type_configs (
        id TEXT PRIMARY KEY NOT NULL,
        space_id TEXT NOT NULL,
        type_slug TEXT NOT NULL,
        label TEXT NOT NULL,
        base_url TEXT NOT NULL,
        auth_json TEXT NOT NULL,
        credential_schema_json TEXT NOT NULL,
        health_check_path TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `)
    client.raw.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS integration_type_configs__space_type_slug
      ON integration_type_configs(space_id, type_slug);
    `)

    client.raw.exec(`
      CREATE TABLE IF NOT EXISTS tool_definitions (
        id TEXT PRIMARY KEY NOT NULL,
        space_id TEXT NOT NULL,
        integration_id TEXT NOT NULL,
        name TEXT NOT NULL,
        display_name TEXT,
        description TEXT NOT NULL,
        scope TEXT NOT NULL,
        input_schema_json TEXT NOT NULL,
        handler_code TEXT NOT NULL,
        utils_json TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `)
    client.raw.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS tool_definitions__space_integration_name
      ON tool_definitions(space_id, integration_id, name);
    `)

    // One-time copy from old custom_* tables (idempotent).
    const hasTable = (name: string) => {
      const row = client.raw.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(name)
      return !!row
    }
    if (hasTable('custom_integration_configs')) {
      const rows = client.raw.prepare(`
        SELECT id, space_id, type_slug, label, base_url, auth_type, credential_schema, credential_injection,
               basic_username_field, basic_password_field, health_check_path, created_at, updated_at
        FROM custom_integration_configs
      `).all() as any[]

      const ins = client.raw.prepare(`
        INSERT OR IGNORE INTO integration_type_configs
          (id, space_id, type_slug, label, base_url, auth_json, credential_schema_json, health_check_path, created_at, updated_at)
        VALUES
          (@id, @space_id, @type_slug, @label, @base_url, @auth_json, @credential_schema_json, @health_check_path, @created_at, @updated_at)
      `)

      for (const r of rows) {
        const authJson = (() => {
          if (r.auth_type === 'basic') {
            return JSON.stringify({
              kind: 'basic',
              usernameField: r.basic_username_field,
              passwordField: r.basic_password_field,
            })
          }
          const injection = r.credential_injection ? JSON.parse(r.credential_injection) : {}
          return JSON.stringify({ kind: 'template', injection })
        })()
        ins.run({
          id: r.id,
          space_id: r.space_id,
          type_slug: r.type_slug,
          label: r.label,
          base_url: r.base_url,
          auth_json: authJson,
          credential_schema_json: typeof r.credential_schema === 'string' ? r.credential_schema : JSON.stringify(r.credential_schema || {}),
          health_check_path: r.health_check_path ?? null,
          created_at: r.created_at,
          updated_at: r.updated_at,
        })
      }
    }

    if (hasTable('custom_tools')) {
      const rows = client.raw.prepare(`
        SELECT id, space_id, integration_id, name, label, description, input_schema, handler_code, scope, created_at, updated_at
        FROM custom_tools
      `).all() as any[]

      const ins = client.raw.prepare(`
        INSERT OR IGNORE INTO tool_definitions
          (id, space_id, integration_id, name, display_name, description, scope, input_schema_json, handler_code, utils_json, created_at, updated_at)
        VALUES
          (@id, @space_id, @integration_id, @name, @display_name, @description, @scope, @input_schema_json, @handler_code, @utils_json, @created_at, @updated_at)
      `)

      for (const r of rows) {
        ins.run({
          id: r.id,
          space_id: r.space_id,
          integration_id: r.integration_id,
          name: r.name,
          display_name: r.label ?? null,
          description: r.description ?? '',
          scope: r.scope ?? 'read',
          input_schema_json: typeof r.input_schema === 'string' ? r.input_schema : JSON.stringify(r.input_schema || {}),
          handler_code: r.handler_code ?? '',
          utils_json: null,
          created_at: r.created_at,
          updated_at: r.updated_at,
        })
      }
    }

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
    ALTER TABLE integrations ADD COLUMN IF NOT EXISTS health_status TEXT;
  `)
  await client.raw.query(`
    ALTER TABLE integrations ADD COLUMN IF NOT EXISTS health_checked_at TIMESTAMPTZ;
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

  await client.raw.query(`
    CREATE TABLE IF NOT EXISTS custom_tools (
      id TEXT PRIMARY KEY,
      space_id TEXT NOT NULL,
      integration_id TEXT NOT NULL,
      name TEXT NOT NULL,
      label TEXT,
      description TEXT,
      input_schema TEXT NOT NULL,
      handler_code TEXT NOT NULL,
      scope TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)
  await client.raw.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS custom_tools__space_integration_name
    ON custom_tools(space_id, integration_id, name);
  `)

  await client.raw.query(`
    CREATE TABLE IF NOT EXISTS custom_integration_configs (
      id TEXT PRIMARY KEY,
      space_id TEXT NOT NULL,
      type_slug TEXT NOT NULL,
      label TEXT NOT NULL,
      base_url TEXT NOT NULL,
      auth_type TEXT NOT NULL,
      credential_schema JSONB NOT NULL,
      credential_injection JSONB,
      basic_username_field TEXT,
      basic_password_field TEXT,
      health_check_path TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)
  await client.raw.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS custom_integration_configs__space_type_slug
    ON custom_integration_configs(space_id, type_slug);
  `)

  await client.raw.query(`
    CREATE TABLE IF NOT EXISTS integration_type_configs (
      id TEXT PRIMARY KEY,
      space_id TEXT NOT NULL,
      type_slug TEXT NOT NULL,
      label TEXT NOT NULL,
      base_url TEXT NOT NULL,
      auth_json JSONB NOT NULL,
      credential_schema_json JSONB NOT NULL,
      health_check_path TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)
  await client.raw.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS integration_type_configs__space_type_slug
    ON integration_type_configs(space_id, type_slug);
  `)

  await client.raw.query(`
    CREATE TABLE IF NOT EXISTS tool_definitions (
      id TEXT PRIMARY KEY,
      space_id TEXT NOT NULL,
      integration_id TEXT NOT NULL,
      name TEXT NOT NULL,
      display_name TEXT,
      description TEXT NOT NULL,
      scope TEXT NOT NULL,
      input_schema_json JSONB NOT NULL,
      handler_code TEXT NOT NULL,
      utils_json JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)
  await client.raw.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS tool_definitions__space_integration_name
    ON tool_definitions(space_id, integration_id, name);
  `)

  // One-time copy from old custom_* tables (idempotent).
  await client.raw.query(`
    INSERT INTO integration_type_configs
      (id, space_id, type_slug, label, base_url, auth_json, credential_schema_json, health_check_path, created_at, updated_at)
    SELECT
      id,
      space_id,
      type_slug,
      label,
      base_url,
      CASE
        WHEN auth_type = 'basic' THEN jsonb_build_object('kind','basic','usernameField', basic_username_field, 'passwordField', basic_password_field)
        ELSE jsonb_build_object('kind','template','injection', COALESCE(credential_injection, '{}'::jsonb))
      END as auth_json,
      credential_schema as credential_schema_json,
      health_check_path,
      created_at,
      updated_at
    FROM custom_integration_configs
    ON CONFLICT (id) DO NOTHING;
  `)

  await client.raw.query(`
    INSERT INTO tool_definitions
      (id, space_id, integration_id, name, display_name, description, scope, input_schema_json, handler_code, utils_json, created_at, updated_at)
    SELECT
      id,
      space_id,
      integration_id,
      name,
      label as display_name,
      COALESCE(description, '') as description,
      COALESCE(scope, 'read') as scope,
      input_schema as input_schema_json,
      handler_code,
      NULL as utils_json,
      created_at,
      updated_at
    FROM custom_tools
    ON CONFLICT (id) DO NOTHING;
  `)
}

