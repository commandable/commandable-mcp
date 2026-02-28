async (input) => {
  const params = new URLSearchParams()
  const qParts = ['trashed = false']
  if (input.folderId)
    qParts.push(`'${input.folderId}' in parents`)
  params.set('q', qParts.join(' and '))
  params.set('fields', input.fields || 'nextPageToken,files(id,name,mimeType,modifiedTime,size,parents)')
  params.set('pageSize', String(input.pageSize || 50))
  if (input.pageToken)
    params.set('pageToken', input.pageToken)
  if (input.orderBy)
    params.set('orderBy', input.orderBy)
  const res = await integration.fetch(`/files?${params.toString()}`)
  return await res.json()
}
