async (input) => {
  const flattenHit = (hit) => {
    const resource = hit?.resource || {}
    const parentReference = resource.parentReference || {}
    return {
      id: resource.id || hit?.hitId || null,
      name: resource.name || null,
      webUrl: resource.webUrl || null,
      summary: hit?.summary || '',
      rank: hit?.rank ?? null,
      createdDateTime: resource.createdDateTime || null,
      lastModifiedDateTime: resource.lastModifiedDateTime || null,
      mimeType: resource.file?.mimeType || null,
      size: resource.size ?? null,
      isFolder: Boolean(resource.folder || resource.package),
      isFile: Boolean(resource.file),
      driveId: parentReference.driveId || null,
      siteId: parentReference.siteId || null,
      parentReference,
    }
  }

  const regionResponse = await integration.fetch('/sites?$filter=siteCollection/root ne null&$select=siteCollection')
  const regionData = await regionResponse.json()
  const region = Array.isArray(regionData?.value)
    ? regionData.value.find(site => typeof site?.siteCollection?.dataLocationCode === 'string')?.siteCollection?.dataLocationCode
    : undefined

  if (typeof region !== 'string' || region.length === 0)
    throw new Error('Unable to determine the SharePoint search region for this tenant.')

  const request = {
    entityTypes: ['driveItem'],
    query: {
      queryString: input.query,
    },
    from: typeof input.from === 'number' ? input.from : 0,
    size: typeof input.size === 'number' ? input.size : 25,
    region,
  }

  const res = await integration.fetch('/search/query', {
    method: 'POST',
    body: {
      requests: [request],
    },
  })
  const data = await res.json()
  const container = data?.value?.[0]?.hitsContainers?.[0]
  const allHits = Array.isArray(container?.hits) ? container.hits.map(flattenHit) : []
  const hits = allHits.filter((hit) => {
    if (input.siteId && hit.siteId !== input.siteId)
      return false
    if (input.driveId && hit.driveId !== input.driveId)
      return false
    return true
  })

  return {
    query: input.query,
    hits,
    total: container?.total ?? hits.length,
    moreResultsAvailable: Boolean(container?.moreResultsAvailable),
  }
}
