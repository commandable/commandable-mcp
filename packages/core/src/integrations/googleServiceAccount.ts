import { JWT } from 'google-auth-library'

type CachedToken = {
  token: string
  expiresAtMs: number
}

const cache = new Map<string, CachedToken>()

function cacheKey(args: { serviceAccountJson: string, scopes: string[], subject?: string }): string {
  // Keep key stable but avoid storing the entire JSON as a Map key.
  // client_email is a stable identifier and not secret by itself.
  let email = 'unknown'
  try {
    const parsed = JSON.parse(args.serviceAccountJson || '{}')
    if (typeof parsed?.client_email === 'string')
      email = parsed.client_email
  }
  catch {}

  const scopesKey = [...args.scopes].sort().join(' ')
  const subjectKey = args.subject || ''
  return `${email}::${subjectKey}::${scopesKey}`
}

export async function getGoogleAccessToken(args: {
  serviceAccountJson: string
  scopes: string[]
  subject?: string
}): Promise<string> {
  if (!args.serviceAccountJson)
    throw new Error('Missing serviceAccountJson')
  if (!Array.isArray(args.scopes) || !args.scopes.length)
    throw new Error('Missing scopes')

  const key = cacheKey(args)
  const existing = cache.get(key)
  const now = Date.now()
  if (existing && existing.expiresAtMs - now > 60_000)
    return existing.token

  let parsed: any
  try {
    parsed = JSON.parse(args.serviceAccountJson)
  }
  catch {
    throw new Error('serviceAccountJson must be valid JSON')
  }

  const clientEmail = parsed?.client_email
  const privateKey = parsed?.private_key
  if (typeof clientEmail !== 'string' || !clientEmail.trim())
    throw new Error('serviceAccountJson is missing client_email')
  if (typeof privateKey !== 'string' || !privateKey.trim())
    throw new Error('serviceAccountJson is missing private_key')

  const jwt = new JWT({
    email: clientEmail,
    key: privateKey,
    scopes: args.scopes,
    subject: args.subject,
  })

  const res = await jwt.authorize()
  const token = res?.access_token
  if (!token)
    throw new Error('Failed to mint Google access token')

  const expiresAtMs = typeof res.expiry_date === 'number' ? res.expiry_date : (now + 55 * 60_000)
  cache.set(key, { token, expiresAtMs })
  return token
}

