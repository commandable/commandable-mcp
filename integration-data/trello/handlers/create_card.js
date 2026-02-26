async (input) => {
  const params = new URLSearchParams()
  params.set('idList', input.idList)
  params.set('name', input.name)
  if (input.desc !== undefined)
    params.set('desc', input.desc)
  if (input.due !== undefined && input.due !== null)
    params.set('due', input.due)
  if (input.pos !== undefined && input.pos !== null)
    params.set('pos', String(input.pos))
  const res = await integration.fetch(`/cards?${params.toString()}`, { method: 'POST' })
  return await res.json()
}
