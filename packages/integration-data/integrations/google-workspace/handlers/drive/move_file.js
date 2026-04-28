async (input) => {
  const params = new URLSearchParams()
  params.set('addParents', input.addParents)
  if (input.removeParents)
    params.set('removeParents', input.removeParents)

  const res = await integration.fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(input.fileId)}?${params.toString()}`, {
    method: 'PATCH',
  })
  return await res.json()
}

