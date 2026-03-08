import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineNitroPlugin } from 'nitropack/runtime'
import { SqlCredentialStore, applyConfig, getOrCreateEncryptionSecret, loadConfig } from '@commandable/mcp-core'
import { getDb } from '../utils/db'

function hasAutoConfigFile(): boolean {
  const base = resolve(process.cwd())
  const candidates = [
    'commandable.config.yaml',
    'commandable.config.yml',
    'commandable.config.json',
  ].map(f => resolve(base, f))
  return candidates.some(p => existsSync(p))
}

export default defineNitroPlugin(async () => {
  const explicit = process.env.COMMANDABLE_CONFIG_FILE
  if (!explicit && !hasAutoConfigFile())
    return

  try {
    const { config, path } = loadConfig(explicit || undefined)
    const db = await getDb()
    const secret = getOrCreateEncryptionSecret()
    const store = new SqlCredentialStore(db, secret)
    await applyConfig({ config, db, credentialStore: store })
    // eslint-disable-next-line no-console
    console.info(`[commandable] applied config: ${path}`)
  }
  catch (err) {
    // eslint-disable-next-line no-console
    console.error('[commandable] failed to apply config at startup')
    // eslint-disable-next-line no-console
    console.error(err)
    throw err
  }
})

