import { integer, sqliteTable, text, primaryKey as sqlitePrimaryKey } from 'drizzle-orm/sqlite-core'
import { jsonb, pgTable, primaryKey as pgPrimaryKey, timestamp, text as pgText } from 'drizzle-orm/pg-core'

// SQLite tables (self-hosted default)
export const sqliteIntegrations = sqliteTable('integrations', {
  id: text('id').notNull().primaryKey(),
  spaceId: text('space_id'),
  type: text('type').notNull(),
  referenceId: text('reference_id').notNull(),
  label: text('label').notNull(),
  enabled: integer('enabled').notNull().default(1),
  connectionMethod: text('connection_method'),
  connectionId: text('connection_id'),
  credentialId: text('credential_id'),
  credentialVariant: text('credential_variant'),
  configJson: text('config_json'),
  enabledToolsets: text('enabled_toolsets'),
  maxScope: text('max_scope'),
  disabledTools: text('disabled_tools'),
  healthStatus: text('health_status'),
  healthCheckedAt: integer('health_checked_at', { mode: 'timestamp_ms' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
})

export const sqliteCredentials = sqliteTable('credentials', {
  spaceId: text('space_id').notNull(),
  id: text('id').notNull(),
  ciphertext: text('ciphertext').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
}, t => ({
  pk: sqlitePrimaryKey({ columns: [t.spaceId, t.id] }),
}))

export const sqliteApiKeys = sqliteTable('api_keys', {
  id: text('id').notNull().primaryKey(),
  name: text('name').notNull(),
  keyHash: text('key_hash').notNull(),
  scopesJson: text('scopes_json'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
})

export const sqliteUsers = sqliteTable('users', {
  id: text('id').notNull().primaryKey(),
  email: text('email').notNull(),
  passwordHash: text('password_hash'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
})

// Postgres tables (hosted/production)
export const pgIntegrations = pgTable('integrations', {
  id: pgText('id').notNull().primaryKey(),
  spaceId: pgText('space_id'),
  type: pgText('type').notNull(),
  referenceId: pgText('reference_id').notNull(),
  label: pgText('label').notNull(),
  enabled: pgText('enabled').notNull().default('1'),
  connectionMethod: pgText('connection_method'),
  connectionId: pgText('connection_id'),
  credentialId: pgText('credential_id'),
  credentialVariant: pgText('credential_variant'),
  configJson: jsonb('config_json'),
  enabledToolsets: pgText('enabled_toolsets'),
  maxScope: pgText('max_scope'),
  disabledTools: pgText('disabled_tools'),
  healthStatus: pgText('health_status'),
  healthCheckedAt: timestamp('health_checked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
})

export const pgCredentials = pgTable('credentials', {
  spaceId: pgText('space_id').notNull(),
  id: pgText('id').notNull(),
  ciphertext: pgText('ciphertext').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
}, t => ({
  pk: pgPrimaryKey({ columns: [t.spaceId, t.id] }),
}))

export const pgApiKeys = pgTable('api_keys', {
  id: pgText('id').notNull().primaryKey(),
  name: pgText('name').notNull(),
  keyHash: pgText('key_hash').notNull(),
  scopesJson: jsonb('scopes_json'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
})

export const pgUsers = pgTable('users', {
  id: pgText('id').notNull().primaryKey(),
  email: pgText('email').notNull(),
  passwordHash: pgText('password_hash'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
})

