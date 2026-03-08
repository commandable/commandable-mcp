import { and, eq } from 'drizzle-orm'
import { decrypt, encrypt } from '../crypto/encryption.js'
import type { CredentialStore } from '../integrations/proxy.js'
import type { DbClient } from './client.js'
import { pgCredentials, sqliteCredentials } from './schema.js'

export class SqlCredentialStore implements CredentialStore {
  constructor(
    private readonly client: DbClient,
    private readonly encryptionSecret: string,
  ) {}

  async hasCredentials(spaceId: string, credentialId: string): Promise<boolean> {
    return !!(await this._getRow(spaceId, credentialId))
  }

  async saveCredentials(spaceId: string, credentialId: string, credentials: Record<string, string>): Promise<void> {
    const ciphertext = encrypt(JSON.stringify(credentials ?? {}), this.encryptionSecret)
    const now = new Date()
    const table = this._table()

    await this._db()
      .insert(table)
      .values({ spaceId, id: credentialId, ciphertext, createdAt: now, updatedAt: now })
      .onConflictDoUpdate({
        target: [table.spaceId, table.id],
        set: { ciphertext, updatedAt: now },
      })
  }

  async getCredentials(spaceId: string, credentialId: string): Promise<Record<string, string> | null> {
    const row = await this._getRow(spaceId, credentialId)
    if (!row?.ciphertext)
      return null
    const plaintext = decrypt(row.ciphertext, this.encryptionSecret)
    const parsed = JSON.parse(plaintext)
    return (parsed && typeof parsed === 'object') ? parsed : null
  }

  async deleteCredentials(spaceId: string, credentialId: string): Promise<void> {
    const table = this._table()
    await this._db()
      .delete(table)
      .where(and(eq(table.spaceId, spaceId), eq(table.id, credentialId)))
  }

  private _table() {
    return this.client.dialect === 'sqlite' ? sqliteCredentials : pgCredentials
  }

  private _db(): any {
    return this.client.db
  }

  private async _getRow(spaceId: string, credentialId: string): Promise<any | null> {
    const table = this._table()
    const rows: any[] = await this._db()
      .select()
      .from(table)
      .where(and(eq(table.spaceId, spaceId), eq(table.id, credentialId)))
      .limit(1)
    return rows[0] ?? null
  }
}
