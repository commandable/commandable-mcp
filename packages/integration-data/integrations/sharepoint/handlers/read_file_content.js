async (input) => {
  const params = new URLSearchParams()
  params.set(
    '$select',
    'id,name,webUrl,size,createdDateTime,lastModifiedDateTime,parentReference,file,folder,package',
  )
  const res = await integration.fetch(`/drives/${encodeURIComponent(input.driveId)}/items/${encodeURIComponent(input.itemId)}?${params.toString()}`)
  const item = await res.json()
  const mimeType = input.mimeType || item?.file?.mimeType || null

  if (item?.folder || item?.package) {
    return {
      driveId: input.driveId,
      itemId: input.itemId,
      name: item?.name || null,
      mimeType,
      content: null,
      message: 'Folders do not have readable file content.',
    }
  }

  const extracted = await utils.extractFileContent({
    auth: true,
    source: `/drives/${encodeURIComponent(input.driveId)}/items/${encodeURIComponent(input.itemId)}/content`,
    previewPages: input.previewPages || 0,
  })

  return {
    driveId: input.driveId,
    itemId: input.itemId,
    name: item?.name || null,
    webUrl: item?.webUrl || null,
    mimeType,
    ...extracted,
  }
}
