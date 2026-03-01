async (input) => {
  const limit = typeof input.limit === 'number' ? input.limit : 10
  const start = typeof input.start === 'number' ? input.start : 0

  const params = new URLSearchParams()
  params.set('cql', String(input.cql))
  params.set('limit', String(limit))
  params.set('start', String(start))
  params.set('expand', 'content.space,content.version')

  const res = await integration.fetch(`/wiki/rest/api/search?${params}`)
  const data = await res.json()

  const results = Array.isArray(data?.results)
    ? data.results
        .map((r) => {
          const c = r?.content || {}
          return {
            id: c.id,
            type: c.type,
            title: c.title,
            spaceKey: c?.space?.key,
            version: c?.version?.number,
            lastModified: c?.version?.when,
            excerpt: r?.excerpt,
            webui: c?._links?.webui,
          }
        })
        .filter((x) => x.id)
    : []

  return {
    cql: input.cql,
    start: data?.start ?? start,
    limit: data?.limit ?? limit,
    size: data?.size ?? results.length,
    totalSize: data?.totalSize,
    results,
    links: data?._links || {},
  }
}

