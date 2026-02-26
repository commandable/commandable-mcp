async (input) => {
  const res = await integration.fetch(`/databases`, {
    method: 'POST',
    body: {
      parent: input.parent,
      title: input.title,
      properties: input.properties,
    },
  })
  return await res.json()
}
