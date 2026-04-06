async (input) => {
  const path = input.parentItemId
    ? `/drives/${encodeURIComponent(input.driveId)}/items/${encodeURIComponent(input.parentItemId)}/children`
    : `/drives/${encodeURIComponent(input.driveId)}/root/children`

  const res = await integration.fetch(path, {
    method: 'POST',
    body: {
      name: input.name,
      folder: {},
      '@microsoft.graph.conflictBehavior': input.conflictBehavior || 'rename',
    },
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
