async (input) => {
  const hostname = String(input.hostname || '').trim()
  const rawPath = String(input.relativePath || '').trim()
  const normalizedPath = `/${rawPath.replace(/^\/+/, '')}`
  const encodedPath = normalizedPath
    .split('/')
    .map((segment, index) => index === 0 ? '' : encodeURIComponent(segment))
    .join('/')
  const res = await integration.fetch(`/sites/${hostname}:${encodedPath}`)
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
