async (input) => {
  const params = new URLSearchParams({ idBoard: input.idBoard, name: input.name })
  if (input.pos !== undefined && input.pos !== null)
    params.set('pos', String(input.pos))
  const res = await integration.fetch(`/lists?${params.toString()}`, { method: 'POST' })
  return await res.json()
}
