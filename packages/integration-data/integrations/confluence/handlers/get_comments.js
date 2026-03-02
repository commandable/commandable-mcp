async (input) => {
  const pageId = encodeURIComponent(String(input.pageId))
  const params = new URLSearchParams()

  params.set('body-format', 'STORAGE')

  const limit = typeof input.limit === 'number' ? input.limit : undefined
  if (limit) params.set('limit', String(limit))
  if (input.cursor) params.set('cursor', String(input.cursor))

  const res = await integration.fetch(`/wiki/api/v2/pages/${pageId}/footer-comments?${params}`)
  const data = await res.json()

  const results = Array.isArray(data?.results)
    ? data.results.map((c) => ({
        id: c.id,
        status: c.status,
        title: c.title,
        pageId: c.pageId,
        version: c?.version?.number,
        authorId: c?.version?.authorId,
        createdAt: c?.version?.createdAt,
        body: c?.body,
        webui: c?._links?.webui,
      }))
    : []

  return {
    results,
    links: data?._links || {},
  }
}

