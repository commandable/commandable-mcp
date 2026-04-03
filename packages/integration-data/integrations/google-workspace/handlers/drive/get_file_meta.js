async (input) => {
  const fields = input.fields || 'id,name,mimeType,modifiedTime,createdTime,size,parents,trashed,webViewLink'
  const res = await integration.fetch(`/files/${encodeURIComponent(input.fileId)}?fields=${encodeURIComponent(fields)}`)
  return await res.json()
}
