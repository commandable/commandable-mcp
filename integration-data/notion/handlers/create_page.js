async (input) => {
  const res = await integration.fetch(`/pages`, {
    method: 'POST',
    body: {
      parent: input.parent,
      properties: input.properties,
      children: input.children || undefined,
      icon: input.icon || undefined,
      cover: input.cover || undefined,
    },
  })
  return await res.json()
}
