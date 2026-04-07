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
  const res = await integration.fetch(`/drives/${encodeURIComponent(input.driveId)}/items/${encodeURIComponent(input.itemId)}?${params.toString()}`)
  return flattenItem(await res.json())
}
