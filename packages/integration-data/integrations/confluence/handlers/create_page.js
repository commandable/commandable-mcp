export default (integration) => async (input) => {
  const body = {
    spaceId: String(input.spaceId),
    status: input.status || 'current',
    title: String(input.title),
    body: {
      representation: 'storage',
      value: String(input.bodyStorage),
    },
  }

  if (input.parentId)
    body.parentId = String(input.parentId)

  const res = await integration.fetch('/wiki/api/v2/pages', {
    method: 'POST',
    body,
  })

  return await res.json()
}

