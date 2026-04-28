async (input) => {
  const fields = input.fields || 'id,name,mimeType,modifiedTime,createdTime,size,parents,trashed,webViewLink'
  const res = await integration.fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(input.fileId)}?fields=${encodeURIComponent(fields)}`)
  return await res.json()
}
