import { defineConfig } from 'drizzle-kit'

const dialect = process.env.DATABASE_URL ? 'postgresql' : 'sqlite'
const out = dialect === 'postgresql'
  ? './src/db/migrations/pg'
  : './src/db/migrations/sqlite'

export default defineConfig(
  dialect === 'postgresql'
    ? {
        dialect: 'postgresql',
        schema: './src/db/schema.ts',
        out,
        dbCredentials: { url: process.env.DATABASE_URL! },
      }
    : {
        dialect: 'sqlite',
        schema: './src/db/schema.ts',
        out,
        dbCredentials: { url: process.env.COMMANDABLE_MCP_SQLITE_PATH || ':memory:' },
      },
)
