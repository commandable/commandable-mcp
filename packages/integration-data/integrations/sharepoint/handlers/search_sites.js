async (input) => {
  const params = new URLSearchParams()
  params.set('search', input.query)
  const res = await integration.fetch(`/sites?${params.toString()}`)
  const data = await res.json()
  const sites = Array.isArray(data?.value)
    ? data.value.map(site => ({
        id: site.id,
        name: site.displayName || site.name || null,
        displayName: site.displayName || site.name || null,
        description: site.description || '',
        webUrl: site.webUrl || null,
        createdDateTime: site.createdDateTime || null,
        lastModifiedDateTime: site.lastModifiedDateTime || null,
      }))
    : []
  return { query: input.query, sites }
}
