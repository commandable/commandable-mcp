import { defineEventHandler } from 'h3'
import { homedir } from 'node:os'
import { resolve } from 'node:path'
 
function getSpaceId(): string {
  const v = process.env.COMMANDABLE_SPACE_ID
  return v && v.trim().length ? v.trim() : 'local'
}
 
function getDbIdentity(): { dialect: 'postgres' } | { dialect: 'sqlite', sqlitePath: string } {
  const databaseUrl = process.env.DATABASE_URL
  if (databaseUrl && databaseUrl.trim().length)
    return { dialect: 'postgres' }
 
  const forced = process.env.COMMANDABLE_MCP_SQLITE_PATH
  if (forced && forced.trim().length)
    return { dialect: 'sqlite', sqlitePath: resolve(forced.trim()) }
 
  const dataDir = process.env.COMMANDABLE_DATA_DIR
  if (dataDir && dataDir.trim().length)
    return { dialect: 'sqlite', sqlitePath: resolve(dataDir.trim(), 'credentials.sqlite') }
 
  return { dialect: 'sqlite', sqlitePath: resolve(homedir(), '.commandable', 'credentials.sqlite') }
}
 
export default defineEventHandler(() => {
  return {
    ok: true,
    service: 'commandable-management-ui',
    spaceId: getSpaceId(),
    db: getDbIdentity(),
  }
})

