async (input) => {
  const body = {
    name: input.name,
    mimeType: 'application/vnd.google-apps.folder',
  }
  if (input.parentId)
    body.parents = [input.parentId]

  const res = await integration.fetch('/files', {
    method: 'POST',
    body,
  })
  return await res.json()
}

