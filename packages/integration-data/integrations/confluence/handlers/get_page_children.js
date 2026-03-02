async (input) => {
  const pageId = encodeURIComponent(String(input.pageId))
  const params = new URLSearchParams()

  const limit = typeof input.limit === 'number' ? input.limit : undefined
  if (limit) params.set('limit', String(limit))
  if (input.cursor) params.set('cursor', String(input.cursor))
  if (typeof input.sort === 'string' && input.sort) params.set('sort', input.sort)

  const res = await integration.fetch(`/wiki/api/v2/pages/${pageId}/children${params.toString() ? `?${params}` : ''}`)
  const data = await res.json()

  const results = Array.isArray(data?.results)
    ? data.results.map((c) => ({
        id: c.id,
        type: c.type,
        status: c.status,
        title: c.title,
        parentId: c.parentId,
        spaceId: c.spaceId,
        links: c?._links || {},
      }))
    : []

  return {
    results,
    links: data?._links || {},
  }
}

