import type { LiveToolRetry } from './liveHarness.js'

const DEFAULT_MAX_ATTEMPTS = 4
const DEFAULT_BASE_DELAY_MS = 750
const DEFAULT_MAX_DELAY_MS = 6000

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function errorText(error: unknown): string {
  if (error instanceof Error) {
    const cause = 'cause' in error ? errorText((error as Error & { cause?: unknown }).cause) : ''
    return [error.message, error.stack, cause].filter(Boolean).join('\n')
  }

  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>
    const parts = [
      typeof record.message === 'string' ? record.message : '',
      typeof record.stack === 'string' ? record.stack : '',
      'cause' in record ? errorText(record.cause) : '',
    ]
    try {
      parts.push(JSON.stringify(record))
    }
    catch {}
    return parts.filter(Boolean).join('\n')
  }

  return String(error)
}

function isTemporaryGoogleProxyError(error: unknown) {
  const text = errorText(error)
  return /temporary issue|backendError|internalError/i.test(text)
}

async function withGoogleTemporaryIssueRetry<T>(
  fn: () => Promise<T>,
  context: { type: string, scope: string, name: string },
): Promise<T> {
  let lastError: unknown
  const toolLabel = `${context.type}.${context.scope}.${context.name}`

  for (let attempt = 1; attempt <= DEFAULT_MAX_ATTEMPTS; attempt++) {
    try {
      return await fn()
    }
    catch (error) {
      lastError = error
      if (attempt >= DEFAULT_MAX_ATTEMPTS || !isTemporaryGoogleProxyError(error))
        break

      const exponentialDelay = Math.min(DEFAULT_MAX_DELAY_MS, DEFAULT_BASE_DELAY_MS * 2 ** (attempt - 1))
      const jitter = Math.floor(Math.random() * DEFAULT_BASE_DELAY_MS)
      await sleep(exponentialDelay + jitter)
    }
  }

  if (isTemporaryGoogleProxyError(lastError))
    throw new Error(`Google temporary issue retry exhausted for ${toolLabel}: ${errorText(lastError)}`)

  throw lastError
}

export const retryGoogleTemporaryIssues: LiveToolRetry = (run, context) => {
  return input => withGoogleTemporaryIssueRetry(() => run(input), context)
}
