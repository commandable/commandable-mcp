async (input) => {
  const body = {
    parentReference: {
      id: input.destinationParentId,
    },
  }
  if (input.newName)
    body.name = input.newName

  const res = await integration.fetch(`/drives/${encodeURIComponent(input.driveId)}/items/${encodeURIComponent(input.itemId)}`, {
    method: 'PATCH',
    body,
  })
  const item = await res.json()
  return {
    id: item.id,
    name: item.name || null,
    webUrl: item.webUrl || null,
    size: item.size ?? null,
    createdDateTime: item.createdDateTime || null,
    lastModifiedDateTime: item.lastModifiedDateTime || null,
    mimeType: item.file?.mimeType || null,
    isFolder: Boolean(item.folder || item.package),
    isFile: Boolean(item.file),
    childCount: item.folder?.childCount ?? null,
    parentReference: item.parentReference || null,
  }
}
