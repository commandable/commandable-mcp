async (input) => {
  const res = await integration.fetch(`/sites/${encodeURIComponent(input.siteId)}`)
  const site = await res.json()
  return {
    id: site.id,
    name: site.displayName || site.name || null,
    displayName: site.displayName || site.name || null,
    description: site.description || '',
    webUrl: site.webUrl || null,
    createdDateTime: site.createdDateTime || null,
    lastModifiedDateTime: site.lastModifiedDateTime || null,
  }
}
