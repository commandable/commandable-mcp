async (input) => {
  const params = new URLSearchParams()
  params.set('name', input.name)
  if (input.defaultLists !== undefined && input.defaultLists !== null)
    params.set('defaultLists', String(Boolean(input.defaultLists)))
  if (input.desc !== undefined && input.desc !== null)
    params.set('desc', String(input.desc))
  const res = await integration.fetch(`/boards?${params.toString()}`, { method: 'POST' })
  return await res.json()
}

