import type { DbClient } from '../db/client.js'
import { getIntegrationTypeConfig } from '../db/integrationTypeConfigStore.js'
import type { IntegrationTypeConfig } from '../types.js'
import { getBuiltInIntegrationTypeConfig } from './fileIntegrationTypeConfigStore.js'

/**
 * Find an integration type config from either built-in file data or the DB.
 * Built-in file-backed types win over DB rows with the same slug.
 */
export async function findIntegrationTypeConfig(params: {
  db: DbClient
  spaceId: string
  typeSlug: string
}): Promise<IntegrationTypeConfig | null> {
  return getBuiltInIntegrationTypeConfig(params.typeSlug)
    ?? await getIntegrationTypeConfig(params.db, params.spaceId, params.typeSlug)
}
