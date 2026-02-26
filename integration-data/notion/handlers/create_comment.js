async (input) => {
  const res = await integration.fetch(`/comments`, {
    method: 'POST',
    body: {
      parent: input.parent,
      rich_text: input.rich_text,
    },
  })
  return await res.json()
}
