CREATE TABLE IF NOT EXISTS "integrations" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "space_id" TEXT,
  "type" TEXT NOT NULL,
  "reference_id" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "enabled" INTEGER NOT NULL DEFAULT 1,
  "connection_method" TEXT,
  "connection_id" TEXT,
  "credential_id" TEXT,
  "credential_variant" TEXT,
  "config_json" JSONB,
  "enabled_toolsets" TEXT,
  "max_scope" TEXT,
  "disabled_tools" TEXT,
  "health_status" TEXT,
  "health_checked_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "credentials" (
  "space_id" TEXT NOT NULL,
  "id" TEXT NOT NULL,
  "ciphertext" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY("space_id", "id")
);

CREATE TABLE IF NOT EXISTS "api_keys" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "name" TEXT NOT NULL,
  "key_hash" TEXT NOT NULL,
  "scopes_json" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "users" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "email" TEXT NOT NULL,
  "password_hash" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "integration_type_configs" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "space_id" TEXT NOT NULL,
  "type_slug" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "base_url" TEXT NOT NULL,
  "auth_json" JSONB NOT NULL,
  "credential_schema_json" JSONB NOT NULL,
  "health_check_path" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "integration_type_configs__space_type_slug"
  ON "integration_type_configs"("space_id", "type_slug");

CREATE TABLE IF NOT EXISTS "tool_definitions" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "space_id" TEXT NOT NULL,
  "integration_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "display_name" TEXT,
  "description" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "input_schema_json" JSONB NOT NULL,
  "handler_code" TEXT NOT NULL,
  "utils_json" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "tool_definitions__space_integration_name"
  ON "tool_definitions"("space_id", "integration_id", "name");
