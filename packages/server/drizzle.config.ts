import { defineConfig } from 'drizzle-kit'

const dialect = process.env.DATABASE_URL ? 'postgresql' : 'sqlite'

export default defineConfig(
  dialect === 'postgresql'
    ? {
        dialect: 'postgresql',
        schema: './src/db/schema.ts',
        out: './src/db/migrations',
        dbCredentials: { url: process.env.DATABASE_URL! },
      }
    : {
        dialect: 'sqlite',
        schema: './src/db/schema.ts',
        out: './src/db/migrations',
        dbCredentials: { url: process.env.COMMANDABLE_MCP_SQLITE_PATH || ':memory:' },
      },
)
