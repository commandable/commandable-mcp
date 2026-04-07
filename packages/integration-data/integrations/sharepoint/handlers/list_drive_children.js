async (input) => {
  const flattenItem = item => ({
    id: item.id,
    name: item.name || null,
    webUrl: item.webUrl || null,
    size: item.size ?? null,
    createdDateTime: item.createdDateTime || null,
    lastModifiedDateTime: item.lastModifiedDateTime || null,
    eTag: item.eTag || null,
    cTag: item.cTag || null,
    mimeType: item.file?.mimeType || null,
    isFolder: Boolean(item.folder || item.package),
    isFile: Boolean(item.file),
    childCount: item.folder?.childCount ?? null,
    parentReference: item.parentReference || null,
  })

  const params = new URLSearchParams()
  params.set(
    '$select',
    'id,name,webUrl,size,createdDateTime,lastModifiedDateTime,eTag,cTag,parentReference,file,folder,package',
  )
  if (input.top)
    params.set('$top', String(input.top))
  if (input.orderBy)
    params.set('$orderby', input.orderBy)

  const basePath = input.itemId
    ? `/drives/${encodeURIComponent(input.driveId)}/items/${encodeURIComponent(input.itemId)}/children`
    : `/drives/${encodeURIComponent(input.driveId)}/root/children`

  const res = await integration.fetch(`${basePath}?${params.toString()}`)
  const data = await res.json()

  return {
    driveId: input.driveId,
    itemId: input.itemId || null,
    children: Array.isArray(data?.value) ? data.value.map(flattenItem) : [],
    nextLink: data?.['@odata.nextLink'] || null,
  }
}
