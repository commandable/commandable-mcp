async (input) => {
  const body = {
    name: input.name,
    mimeType: input.mimeType,
  }
  if (input.parentId)
    body.parents = [input.parentId]

  const res = await integration.fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    body,
  })
  return await res.json()
}

