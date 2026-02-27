async (input) => {
  const params = new URLSearchParams()
  params.set('addParents', input.addParents)
  if (input.removeParents)
    params.set('removeParents', input.removeParents)

  const res = await integration.fetch(`/files/${encodeURIComponent(input.fileId)}?${params.toString()}`, {
    method: 'PATCH',
  })
  return await res.json()
}

