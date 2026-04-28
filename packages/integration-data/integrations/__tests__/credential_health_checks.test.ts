import { describe, expect, it } from 'vitest'
import { listIntegrationTypes, loadIntegrationVariants } from '../../src/loader.ts'

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
const OBVIOUSLY_DESTRUCTIVE_PATH_RE = /\/(?:delete|remove|archive|trash|send|batchUpdate)(?:[/?#]|$)/i

describe('credential health checks', () => {
  it('declares a concrete, read-only health check for every prebuilt credential variant', () => {
    const missingConcreteChecks: string[] = []
    const writeChecks: string[] = []
    const destructiveChecks: string[] = []
    const invalidExpectedStatuses: string[] = []
    const preprocessWithoutChecks: string[] = []

    for (const integrationType of listIntegrationTypes()) {
      const variantsFile = loadIntegrationVariants(integrationType)
      if (!variantsFile)
        continue

      for (const [variantKey, variant] of Object.entries(variantsFile.variants)) {
        const label = `${integrationType}/${variantKey}`
        const healthCheck = variant.healthCheck

        if (!healthCheck || !('path' in healthCheck)) {
          missingConcreteChecks.push(label)
          continue
        }

        const method = (healthCheck.method ?? 'GET').toUpperCase()
        if (WRITE_METHODS.has(method))
          writeChecks.push(`${label} uses ${method}`)

        if (OBVIOUSLY_DESTRUCTIVE_PATH_RE.test(healthCheck.path))
          destructiveChecks.push(`${label} uses ${healthCheck.path}`)

        if (healthCheck.expectStatus !== undefined) {
          const expectedStatuses = Array.isArray(healthCheck.expectStatus)
            ? healthCheck.expectStatus
            : [healthCheck.expectStatus]
          if (!expectedStatuses.length || expectedStatuses.some(status => !Number.isInteger(status) || status < 100 || status > 599))
            invalidExpectedStatuses.push(label)
        }

        if (variant.preprocess && !healthCheck.path.trim())
          preprocessWithoutChecks.push(label)
      }
    }

    expect(missingConcreteChecks, `Credential variants without concrete health checks: ${missingConcreteChecks.join(', ')}`).toEqual([])
    expect(writeChecks, `Credential health checks must be read-only: ${writeChecks.join(', ')}`).toEqual([])
    expect(destructiveChecks, `Credential health checks target destructive-looking paths: ${destructiveChecks.join(', ')}`).toEqual([])
    expect(invalidExpectedStatuses, `Credential health checks with invalid expectStatus: ${invalidExpectedStatuses.join(', ')}`).toEqual([])
    expect(preprocessWithoutChecks, `Preprocessed credential variants must still declare health check paths: ${preprocessWithoutChecks.join(', ')}`).toEqual([])
  })
})
