async (input) => {
  const { title, ...rest } = input
  const body = {}
  if (title !== undefined)
    body.title = title
  Object.assign(body, rest)
  const res = await integration.fetch(`/documents`, { method: 'POST', body })
  return await res.json()
}
