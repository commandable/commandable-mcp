export function sanitizeJsonSchema(schema: any): any {
  if (!schema || typeof schema !== 'object')
    return schema
  if (Array.isArray(schema))
    return schema.map(sanitizeJsonSchema)

  const isNullOnlySchema = (s: any): boolean => {
    if (!s || typeof s !== 'object')
      return false
    if (s.type === 'null')
      return true
    if (Array.isArray(s.type) && s.type.length > 0 && s.type.every((t: any) => t === 'null'))
      return true
    return false
  }

  const pickFirstNonNullVariant = (arr: any[]): any | null => {
    const sanitized = (arr || []).map(sanitizeJsonSchema)
    const nonNull = sanitized.filter(s => !isNullOnlySchema(s))
    return nonNull.length ? nonNull[0] : null
  }

  if (Array.isArray((schema as any).oneOf)) {
    const picked = pickFirstNonNullVariant((schema as any).oneOf)
    if (picked) {
      const { oneOf: _oneOf, ...rest } = schema as any
      return sanitizeJsonSchema({ ...rest, ...picked })
    }
  }
  if (Array.isArray((schema as any).anyOf)) {
    const picked = pickFirstNonNullVariant((schema as any).anyOf)
    if (picked) {
      const { anyOf: _anyOf, ...rest } = schema as any
      return sanitizeJsonSchema({ ...rest, ...picked })
    }
  }

  const out: any = {}
  for (const [k, v] of Object.entries(schema)) {
    if (k === '$schema' || k === '$id')
      continue
    if (k === 'type' && typeof v === 'string' && v === 'integer') { out[k] = 'number'; continue }

    if (k === 'type' && Array.isArray(v)) {
      const kept = (v as any[])
        .filter(t => t !== 'null')
        .map(t => t === 'integer' ? 'number' : t)
        .filter(Boolean)
      if (kept.length === 1) { out[k] = kept[0]; continue }
      if (kept.length > 1) { out[k] = kept[0]; continue }
      continue
    }
    out[k] = sanitizeJsonSchema(v)
  }
  return out
}

export function makeIntegrationToolName(type: string, name: string, nodeId: string): string {
  const short = (nodeId || '').replace(/[^a-z0-9]/gi, '').slice(0, 8).toLowerCase()
  let base = `${type}__${name}`.toLowerCase().replace(/[^a-z0-9_]/g, '_')
  const suffix = `__n${short}`
  const maxBase = 64 - suffix.length
  if (base.length > maxBase)
    base = base.slice(0, maxBase)
  return `${base}${suffix}`
}

