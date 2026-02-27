async (input) => {
  const res = await integration.fetch(`/files/${encodeURIComponent(input.fileId)}?fields=id,name,mimeType,parents,trashed`, {
    method: 'GET',
  })
  return await res.json()
}

