async (input) => {
  const params = new URLSearchParams()

  if (Array.isArray(input.ids))
    for (const id of input.ids) params.append('ids', String(id))
  if (Array.isArray(input.keys))
    for (const key of input.keys) params.append('keys', String(key))
  if (typeof input.type === 'string' && input.type)
    params.set('type', input.type)
  if (typeof input.status === 'string' && input.status)
    params.set('status', input.status)

  const limit = typeof input.limit === 'number' ? input.limit : undefined
  if (limit) params.set('limit', String(limit))

  if (input.cursor) params.set('cursor', String(input.cursor))

  const path = `/wiki/api/v2/spaces${params.toString() ? `?${params}` : ''}`
  const res = await integration.fetch(path)
  const data = await res.json()

  const results = Array.isArray(data?.results)
    ? data.results.map((s) => ({
        id: s.id,
        key: s.key,
        name: s.name,
        type: s.type,
        status: s.status,
        homepageId: s.homepageId,
        webui: s?._links?.webui,
      }))
    : []

  return {
    results,
    links: data?._links || {},
  }
}

