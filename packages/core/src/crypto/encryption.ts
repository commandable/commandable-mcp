import crypto from 'node:crypto'

const algorithm = 'aes-256-cbc'

function getKey(secret: string): Buffer {
  return crypto.createHash('sha256').update(secret).digest()
}

export function encrypt(text: string, secret: string): string {
  const key = getKey(secret)
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(algorithm, key, iv)

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return `${iv.toString('hex')}:${encrypted}`
}

export function decrypt(encryptedText: string, secret: string): string {
  const key = getKey(secret)
  const parts = encryptedText.split(':')
  if (parts.length !== 2)
    throw new Error('Invalid encrypted text format')
  const ivHex = parts[0]
  const encrypted = parts[1]
  if (!ivHex || !encrypted)
    throw new Error('Invalid encrypted text format')
  const iv = Buffer.from(ivHex, 'hex')
  const decipher = crypto.createDecipheriv(algorithm, key, iv)
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

