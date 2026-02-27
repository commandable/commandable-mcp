import { distance as levenshtein } from 'fastest-levenshtein'
import { listIntegrationCatalog } from '@commandable/integration-data'

export type { IntegrationCatalogItem } from '@commandable/integration-data'

export { listIntegrationCatalog } from '@commandable/integration-data'

export function searchIntegrationCatalog(query: string, limit: number = 10): Array<{ type: string, name: string, score: number }> {
  const items = listIntegrationCatalog()
  const q = (query || '').toLowerCase().trim()
  if (!q)
    return items.slice(0, limit).map(i => ({ ...i, score: 0 }))

  const qTokens = q.split(/\s+/g)

  const scored: Array<{ type: string, name: string, score: number }> = []
  for (const it of items) {
    let score = 0
    const name = it.name.toLowerCase()
    const type = it.type.toLowerCase()
    const combined = `${name} ${type}`

    if (type === q || name === q) score += 15
    if (combined.includes(q)) score += 10
    if (combined.startsWith(q)) score += 12

    for (const t of qTokens) {
      if (!t) continue
      if (name.startsWith(t)) score += 6
      else if (name.includes(t)) score += 4
      if (type.startsWith(t)) score += 6
      else if (type.includes(t)) score += 4
    }

    const dType = levenshtein(type, q)
    const dName = levenshtein(name, q)
    if (dType <= 2) score += 5 - dType
    if (dName <= 2) score += 5 - dName

    scored.push({ ...it, score })
  }

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit)
}
